import type { NormalizedUsageRecord, ProviderPlugin } from "@ai-usage-tracker/shared";

/**
 * GitHub's per-user billing usage report requires a personal access token
 * with access to the account's "enhanced billing platform" data (see
 * docs.github.com/en/rest/billing/usage) — a classic PAT with the `read:user`
 * scope is enough for accounts that have it; older billing-model accounts get
 * an HTTP 403 with no usage data. The token is expected in
 * `GITHUB_COPILOT_TOKEN`, set by packages/desktop/src/main.cjs the same way
 * OPENAI_ADMIN_API_KEY is (safeStorage-encrypted, decrypted only in the main
 * process). This plugin never touches disk itself.
 */
const GITHUB_API_BASE = "https://api.github.com";
const API_VERSION = "2026-03-10";
const REQUEST_TIMEOUT_MS = 15_000;
const WINDOW_DAYS = 30;

interface UsageItem {
  date?: string;
  product?: string;
  sku?: string;
  quantity?: number;
  unitType?: string;
  pricePerUnit?: number;
  grossAmount?: number;
  discountAmount?: number;
  netAmount?: number;
  repositoryName?: string;
}

interface UsageResponse {
  usageItems?: UsageItem[];
}

interface GitHubUser {
  login?: string;
}

/**
 * GETs one path from GitHub's REST API. Returns `null` on any failure
 * (missing token, network error, non-2xx status, malformed JSON) — callers
 * treat `null` as "no data available", never as a thrown exception.
 */
async function githubGet<T>(path: string): Promise<T | null> {
  const token = process.env.GITHUB_COPILOT_TOKEN;
  if (!token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const hint =
        response.status === 403
          ? " (this account may not have access to GitHub's enhanced billing platform, or the token lacks the required scope)"
          : "";
      console.error(`[github-copilot] GET ${path} returned HTTP ${response.status}${hint}`);
      return null;
    }
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) {
      console.error(`[github-copilot] GET ${path} returned a non-object response body`);
      return null;
    }
    return body as T;
  } catch (err) {
    console.error(`[github-copilot] request to ${path} failed:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveLogin(): Promise<string | null> {
  const user = await githubGet<GitHubUser>("/user");
  return typeof user?.login === "string" && user.login.trim() !== "" ? user.login : null;
}

/**
 * `GET /users/{username}/settings/billing/usage` is scoped to a single
 * calendar month per call (`year`/`month` select it; an optional `day`
 * narrows to one day). Omitting `day` is assumed to return the whole month's
 * `usageItems` — the same shape this endpoint has historically used for other
 * billing categories (Actions minutes, Packages storage) — but this is
 * unverified against a real enhanced-billing account and worth confirming
 * before relying on it for anything beyond a rough estimate.
 */
async function fetchMonthUsage(login: string, year: number, month: number): Promise<UsageResponse | null> {
  return githubGet<UsageResponse>(`/users/${encodeURIComponent(login)}/settings/billing/usage?year=${year}&month=${month}`);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export class GitHubCopilotPlugin implements ProviderPlugin {
  readonly name = "github-copilot";
  readonly displayName = "GitHub Copilot";
  readonly requiresCredentials = true;

  async connect(): Promise<boolean> {
    if (!process.env.GITHUB_COPILOT_TOKEN) return false;
    const login = await resolveLogin();
    if (!login) return false;
    const now = new Date();
    const response = await fetchMonthUsage(login, now.getUTCFullYear(), now.getUTCMonth() + 1);
    return response !== null;
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    // Called every ingestion cycle regardless of connection state — no-op
    // immediately (rather than making doomed network calls) when unconfigured.
    if (!process.env.GITHUB_COPILOT_TOKEN) return [];

    const login = await resolveLogin();
    if (!login) return [];

    const cutoff = daysAgo(WINDOW_DAYS);
    const now = new Date();
    const months = new Map<string, { year: number; month: number }>();
    months.set(`${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`, {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    });
    // Also cover last month when the lookback window reaches into it.
    if (cutoff.getUTCFullYear() !== now.getUTCFullYear() || cutoff.getUTCMonth() !== now.getUTCMonth()) {
      months.set(`${cutoff.getUTCFullYear()}-${cutoff.getUTCMonth() + 1}`, {
        year: cutoff.getUTCFullYear(),
        month: cutoff.getUTCMonth() + 1,
      });
    }

    const allItems: UsageItem[] = [];
    for (const { year, month } of months.values()) {
      const response = await fetchMonthUsage(login, year, month);
      if (Array.isArray(response?.usageItems)) allItems.push(...response.usageItems);
    }

    const records: NormalizedUsageRecord[] = [];
    for (const item of allItems) {
      if (!item || typeof item.date !== "string") continue;
      const timestamp = new Date(`${item.date}T00:00:00.000Z`);
      if (Number.isNaN(timestamp.getTime()) || timestamp < cutoff) continue;

      // No token counts in this API — only a billed quantity + dollar amount.
      // sku is the most specific dimension GitHub exposes (e.g. a request
      // tier or model-scoped SKU string); fall back to product when absent.
      const modelName =
        typeof item.sku === "string" && item.sku.trim() !== ""
          ? item.sku
          : typeof item.product === "string" && item.product.trim() !== ""
            ? item.product
            : "unknown";

      // Repos get their own project bucket when GitHub attributes usage to
      // one; otherwise everything lands in one account-level placeholder.
      const projectPath =
        typeof item.repositoryName === "string" && item.repositoryName.trim() !== ""
          ? `github-copilot:${item.repositoryName}`
          : "github-copilot-account";

      const externalId = `github-copilot-${item.date}-${item.product ?? ""}-${item.sku ?? ""}-${item.repositoryName ?? "account"}`;

      records.push({
        externalId,
        providerName: "github-copilot",
        modelName,
        projectPath,
        // No real session concept for this provider — reuse the same id.
        sessionExternalId: externalId,
        entrypoint: "github-copilot-billing-api",
        timestamp,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        isSidechain: false,
        precomputedCostUsd: typeof item.netAmount === "number" ? item.netAmount : 0,
      });
    }

    return records;
  }
}
