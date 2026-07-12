import { basename } from "node:path";
import { getDb } from "@ai-usage-tracker/db";
import { computeCost, getModelPricing, type NormalizedUsageRecord } from "@ai-usage-tracker/shared";
import { getEnabledPlugins } from "./providers.js";

// Warn at most once per unpriced model per process lifetime, not once per request.
const warnedUnpricedModels = new Set<string>();

/** Persists normalized usage records, upserting Provider/Project/Session/Model as needed. */
export async function persistRecords(records: NormalizedUsageRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const db = getDb();
  let written = 0;

  for (const record of records) {
    const provider = await db.provider.upsert({
      where: { name: record.providerName },
      update: {},
      create: { name: record.providerName, type: "coding-assistant" },
    });

    const project = await db.project.upsert({
      where: { path: record.projectPath },
      update: { lastSeenAt: record.timestamp },
      create: {
        path: record.projectPath,
        name: basename(record.projectPath),
        firstSeenAt: record.timestamp,
        lastSeenAt: record.timestamp,
      },
    });

    const pricing = getModelPricing(record.modelName);
    // A plugin supplying its own precomputedCostUsd (OpenAI, GitHub Copilot)
    // means cost is known even when this model has no entry in the local,
    // Claude-specific pricing table — only warn/flag when neither source
    // can account for the cost.
    const costKnown = pricing !== undefined || record.precomputedCostUsd !== undefined;
    if (!costKnown && !warnedUnpricedModels.has(record.modelName)) {
      warnedUnpricedModels.add(record.modelName);
      console.warn(
        `[ingest] No pricing entry for model "${record.modelName}" — its requests will be recorded with cost=0 until pricing.ts is updated.`,
      );
    }
    const model = await db.model.upsert({
      where: { providerId_name: { providerId: provider.id, name: record.modelName } },
      update: { pricingUnknown: !costKnown },
      create: {
        providerId: provider.id,
        name: record.modelName,
        contextWindow: pricing?.contextWindow ?? 0,
        inputPricePerMTok: pricing?.inputPerMTok ?? 0,
        outputPricePerMTok: pricing?.outputPerMTok ?? 0,
        cacheReadPricePerMTok: pricing?.cacheReadPerMTok ?? 0,
        cacheWritePricePerMTok: pricing?.cacheWrite5mPerMTok ?? 0,
        pricingUnknown: !costKnown,
      },
    });

    const session = await db.session.upsert({
      where: { providerId_externalId: { providerId: provider.id, externalId: record.sessionExternalId } },
      update: { endTime: record.timestamp },
      create: {
        providerId: provider.id,
        externalId: record.sessionExternalId,
        projectId: project.id,
        entrypoint: record.entrypoint,
        startTime: record.timestamp,
        endTime: record.timestamp,
      },
    });

    const cost = record.precomputedCostUsd ?? (pricing ? computeCost(pricing, record) : 0);

    const result = await db.request.upsert({
      where: { externalId: record.externalId },
      update: {},
      create: {
        externalId: record.externalId,
        sessionId: session.id,
        modelId: model.id,
        timestamp: record.timestamp,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        cacheReadTokens: record.cacheReadTokens,
        cacheCreationTokens: record.cacheCreationTokens,
        isSidechain: record.isSidechain,
        cost,
      },
    });
    if (result) written++;
  }

  return written;
}

/** Runs one ingestion cycle across every enabled provider plugin. */
export async function runIngestionCycle(): Promise<number> {
  let total = 0;
  for (const plugin of await getEnabledPlugins()) {
    const records = await plugin.fetchUsage();
    total += await persistRecords(records);
  }
  return total;
}
