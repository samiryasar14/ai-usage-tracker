import { getDb } from "@ai-usage-tracker/db";
import type { NormalizedUsageRecord } from "@ai-usage-tracker/shared";

/**
 * Manual, file-based multi-device sync: export every Request row as a
 * portable NormalizedUsageRecord bundle, and re-run it through the same
 * persistRecords() pipeline ingestion already uses on another machine.
 * Upsert-by-externalId (already how persistRecords works) makes this safe
 * to re-run and naturally merges two machines' distinct data — there's no
 * separate conflict-resolution logic to get wrong. Not automatic/real-time;
 * the user exports on one machine and imports on the other whenever they
 * want to consolidate.
 */
export async function exportSyncBundle(): Promise<NormalizedUsageRecord[]> {
  const db = getDb();
  const requests = await db.request.findMany({
    include: { model: { include: { provider: true } }, session: { include: { project: true } } },
    orderBy: { timestamp: "asc" },
  });

  return requests.map((r) => ({
    externalId: r.externalId,
    providerName: r.model.provider.name,
    modelName: r.model.name,
    projectPath: r.session.project.path,
    sessionExternalId: r.session.externalId,
    entrypoint: r.session.entrypoint,
    timestamp: r.timestamp,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheCreationTokens: r.cacheCreationTokens,
    isSidechain: r.isSidechain,
    // Preserve the cost exactly as computed on this machine, rather than
    // letting the importing machine recompute it from its own pricing
    // table state (which may have drifted between export and import).
    precomputedCostUsd: r.cost,
  }));
}

/**
 * Defensively parses an untrusted JSON array (an uploaded sync bundle) into
 * NormalizedUsageRecord[] — malformed or missing-field entries are dropped
 * rather than failing the whole import.
 */
export function parseSyncBundle(body: unknown): NormalizedUsageRecord[] {
  if (!Array.isArray(body)) return [];
  const records: NormalizedUsageRecord[] = [];

  for (const item of body) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.externalId !== "string" ||
      typeof r.providerName !== "string" ||
      typeof r.modelName !== "string" ||
      typeof r.projectPath !== "string" ||
      typeof r.sessionExternalId !== "string"
    ) {
      continue;
    }
    const timestamp = new Date(r.timestamp as string);
    if (Number.isNaN(timestamp.getTime())) continue;

    records.push({
      externalId: r.externalId,
      providerName: r.providerName,
      modelName: r.modelName,
      projectPath: r.projectPath,
      sessionExternalId: r.sessionExternalId,
      entrypoint: typeof r.entrypoint === "string" ? r.entrypoint : null,
      timestamp,
      inputTokens: typeof r.inputTokens === "number" ? r.inputTokens : 0,
      outputTokens: typeof r.outputTokens === "number" ? r.outputTokens : 0,
      cacheReadTokens: typeof r.cacheReadTokens === "number" ? r.cacheReadTokens : 0,
      cacheCreationTokens: typeof r.cacheCreationTokens === "number" ? r.cacheCreationTokens : 0,
      isSidechain: r.isSidechain === true,
      precomputedCostUsd: typeof r.precomputedCostUsd === "number" ? r.precomputedCostUsd : undefined,
    });
  }

  return records;
}
