import type { NormalizedUsageRecord, ProviderPlugin } from "@ai-usage-tracker/shared";

/**
 * OpenAI's organization Usage/Cost APIs require an *Admin* API key (created under
 * https://platform.openai.com/settings/organization/admin-keys), NOT a regular
 * `sk-...` project API key — regular keys get an HTTP 401 on every endpoint this
 * plugin calls. The key is expected in `OPENAI_ADMIN_API_KEY`, set by
 * packages/desktop/src/main.cjs when it spawns the server process (see that file
 * for how the key is stored/decrypted — this plugin never touches disk itself).
 */
const OPENAI_API_BASE = "https://api.openai.com/v1";

/**
 * Re-fetched in full every ingestion cycle. Records upsert by `externalId`
 * (date + model), so overlapping windows across cycles are harmless.
 */
const WINDOW_DAYS = 7;

/** Generous buffer over WINDOW_DAYS so day-boundary rounding never clips a bucket. Under both endpoints' max (31 for usage, 180 for costs). */
const BUCKET_LIMIT = WINDOW_DAYS + 3;

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * OpenAI's org-level usage/cost APIs have no notion of a local project directory
 * the way Claude Code's transcripts do — usage is scoped to the whole
 * organization (optionally an OpenAI "project", which is unrelated to a
 * filesystem path). Everything is attributed to this one synthetic project so it
 * still groups sensibly in a UI built around `projectPath`, instead of crashing
 * or leaving the field empty.
 */
const PLACEHOLDER_PROJECT_PATH = "openai-account";

// ---------------------------------------------------------------------------
// Minimal shapes for the slice of OpenAI's response this plugin reads.
// Confirmed against OpenAI's live API reference (developers.openai.com) as of
// 2026-07-08: GET /organization/usage/completions and GET /organization/costs,
// both paginated `{ object: "page", data: [ { object: "bucket", start_time,
// end_time, results: [...] } ], has_more, next_page }`.
//
// Every field below is typed optional/nullable even where OpenAI's docs mark it
// required, and every access is guarded at the call site — an unexpected or
// evolved response shape should silently skip the offending bucket/result, never
// throw and abort the whole ingestion cycle.
// ---------------------------------------------------------------------------

interface OpenAIBucket<TResult> {
  object?: string;
  start_time?: number;
  end_time?: number;
  results?: TResult[];
}

interface OpenAIPage<TResult> {
  object?: string;
  data?: Array<OpenAIBucket<TResult>>;
  has_more?: boolean;
  next_page?: string | null;
}

/** `organization.usage.completions.result`, only requested with `group_by=[model]`. */
interface CompletionsResult {
  object?: string;
  input_tokens?: number;
  output_tokens?: number;
  input_cached_tokens?: number;
  num_model_requests?: number;
  model?: string | null;
}

/** `organization.costs.result`, only requested with `group_by=[line_item]`. */
interface CostsResult {
  object?: string;
  amount?: { value?: number; currency?: string };
  line_item?: string | null;
}

type QueryValue = string | number | boolean | string[] | undefined;

/**
 * GETs one page from OpenAI's admin API. Returns `null` on any failure
 * (missing key, network error, non-2xx status, malformed JSON) — callers treat
 * `null` as "no data available", never as a thrown exception.
 */
async function openaiGet<TResult>(
  path: string,
  params: Record<string, QueryValue>,
): Promise<OpenAIPage<TResult> | null> {
  const apiKey = process.env.OPENAI_ADMIN_API_KEY;
  if (!apiKey) return null;

  const url = new URL(OPENAI_API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      // OpenAI's admin API expects array params as repeated `key[]=` entries
      // (confirmed via openai-node's query serializer, which uses `arrayFormat: "brackets"`).
      for (const item of value) url.searchParams.append(`${key}[]`, item);
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      const hint =
        response.status === 401
          ? " (check that OPENAI_ADMIN_API_KEY is an Admin key, not a regular API key)"
          : "";
      console.error(`[openai] GET ${path} returned HTTP ${response.status}${hint}`);
      return null;
    }
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) {
      console.error(`[openai] GET ${path} returned a non-object response body`);
      return null;
    }
    return body as OpenAIPage<TResult>;
  } catch (err) {
    console.error(`[openai] request to ${path} failed:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Follows `next_page` cursors, capped so a malformed/looping API response can't hang ingestion forever. */
async function openaiGetAllPages<TResult>(
  path: string,
  params: Record<string, QueryValue>,
): Promise<Array<OpenAIBucket<TResult>>> {
  const buckets: Array<OpenAIBucket<TResult>> = [];
  const MAX_PAGES = 10;
  let page: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    const response = await openaiGet<TResult>(path, { ...params, page });
    if (!response) break;
    if (Array.isArray(response.data)) buckets.push(...response.data);
    if (!response.has_more || typeof response.next_page !== "string") break;
    page = response.next_page;
  }

  return buckets;
}

/** Unix seconds -> "YYYY-MM-DD" (UTC). Returns null for anything that isn't a finite timestamp. */
function toDateKey(unixSeconds: number | undefined): string | null {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dateKeyToTimestamp(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

interface DayModelTokens {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export class OpenAIPlugin implements ProviderPlugin {
  readonly name = "openai";
  readonly displayName = "OpenAI";
  readonly requiresCredentials = true;

  async connect(): Promise<boolean> {
    if (!process.env.OPENAI_ADMIN_API_KEY) return false;
    // Cheapest possible call: a single 1-day cost bucket, just to confirm the
    // key is present and accepted. Never throws — openaiGet swallows errors.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const response = await openaiGet<CostsResult>("/organization/costs", {
      start_time: nowSeconds - 24 * 60 * 60,
      limit: 1,
    });
    return response !== null;
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    // Called every ingestion cycle regardless of connection state — no-op
    // immediately (rather than making doomed network calls) when unconfigured.
    if (!process.env.OPENAI_ADMIN_API_KEY) return [];

    const nowSeconds = Math.floor(Date.now() / 1000);
    const startTime = nowSeconds - WINDOW_DAYS * 24 * 60 * 60;

    const [completionsBuckets, costsBuckets] = await Promise.all([
      openaiGetAllPages<CompletionsResult>("/organization/usage/completions", {
        start_time: startTime,
        bucket_width: "1d",
        limit: BUCKET_LIMIT,
        group_by: ["model"],
      }),
      openaiGetAllPages<CostsResult>("/organization/costs", {
        start_time: startTime,
        bucket_width: "1d",
        limit: BUCKET_LIMIT,
        group_by: ["line_item"],
      }),
    ]);

    // --- Token counts, per (date, model), from the Usage API. ---
    const tokensByDayModel = new Map<string, DayModelTokens>();
    const modelsByDate = new Map<string, Set<string>>();

    for (const bucket of completionsBuckets) {
      const date = toDateKey(bucket.start_time);
      if (!date || !Array.isArray(bucket.results)) continue;

      for (const result of bucket.results) {
        if (!result || result.object !== "organization.usage.completions.result") continue;
        const model = typeof result.model === "string" && result.model.trim() !== "" ? result.model : "unknown";
        const inputTokens = typeof result.input_tokens === "number" ? result.input_tokens : 0;
        const outputTokens = typeof result.output_tokens === "number" ? result.output_tokens : 0;
        const cacheReadTokens = typeof result.input_cached_tokens === "number" ? result.input_cached_tokens : 0;

        const key = `${date}::${model}`;
        const existing = tokensByDayModel.get(key);
        if (existing) {
          existing.inputTokens += inputTokens;
          existing.outputTokens += outputTokens;
          existing.cacheReadTokens += cacheReadTokens;
        } else {
          tokensByDayModel.set(key, { date, model, inputTokens, outputTokens, cacheReadTokens });
        }

        if (!modelsByDate.has(date)) modelsByDate.set(date, new Set());
        modelsByDate.get(date)!.add(model);
      }
    }

    // --- Cost, per (date, model), best-effort from the Costs API. ---
    //
    // OpenAI's Costs API does NOT support `group_by=model` — only `project_id`,
    // `line_item`, and `api_key_id` (confirmed against live API docs). There is
    // no officially documented, guaranteed-correct way to get a per-model dollar
    // figure from this API. `line_item` values are cost-category strings that
    // typically embed the model id (e.g. "gpt-4o-2024-08-06, input"), so as a
    // best effort we match each line item against the model names actually seen
    // that day (from the Usage API above), preferring the LONGEST matching model
    // name so a more specific id like "gpt-4o-mini" wins over the shorter
    // "gpt-4o" when both are candidates. A line item that can't be confidently
    // matched to exactly one known model is simply dropped from cost
    // attribution — the affected model/day then falls back to ingest.ts's local
    // pricing table (cost recorded as 0 with a warning, since this plugin
    // intentionally ships no OpenAI pricing table). This never throws or drops
    // token data, only cost precision.
    const costByDayModel = new Map<string, number>();

    for (const bucket of costsBuckets) {
      const date = toDateKey(bucket.start_time);
      if (!date || !Array.isArray(bucket.results)) continue;
      const candidates = modelsByDate.get(date);
      if (!candidates || candidates.size === 0) continue;

      for (const result of bucket.results) {
        if (!result || result.object !== "organization.costs.result") continue;
        const amount = typeof result.amount?.value === "number" ? result.amount.value : 0;
        const lineItem = typeof result.line_item === "string" ? result.line_item.toLowerCase() : null;
        if (!lineItem) continue;

        let best: string | null = null;
        for (const model of candidates) {
          if (lineItem.includes(model.toLowerCase()) && (!best || model.length > best.length)) {
            best = model;
          }
        }
        if (!best) continue;

        const key = `${date}::${best}`;
        costByDayModel.set(key, (costByDayModel.get(key) ?? 0) + amount);
      }
    }

    // --- Synthesize one NormalizedUsageRecord per (date, model) bucket. ---
    const records: NormalizedUsageRecord[] = [];
    for (const { date, model, inputTokens, outputTokens, cacheReadTokens } of tokensByDayModel.values()) {
      // Same day + model always produces the same id, so re-fetching overlapping
      // windows across ingestion cycles safely upserts instead of duplicating.
      const externalId = `openai-${date}-${model}`;

      records.push({
        externalId,
        providerName: "openai",
        modelName: model,
        projectPath: PLACEHOLDER_PROJECT_PATH,
        // No real session concept for this provider — reuse the same id.
        sessionExternalId: externalId,
        entrypoint: "openai-api",
        timestamp: dateKeyToTimestamp(date),
        inputTokens,
        outputTokens,
        cacheReadTokens,
        // OpenAI's usage API exposes no prompt-cache *write* concept to report here.
        cacheCreationTokens: 0,
        isSidechain: false,
        precomputedCostUsd: costByDayModel.get(`${date}::${model}`),
      });
    }

    return records;
  }
}
