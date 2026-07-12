import { getDb } from "@ai-usage-tracker/db";
import { getRetentionDays } from "./settings.js";

export interface ArchivedDay {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

/** Archived days on or after `sinceDate` ("YYYY-MM-DD") — used to fill in history getTimeline's live Request query can no longer see. */
export async function getArchivedDailyUsage(sinceDate: string): Promise<ArchivedDay[]> {
  const db = getDb();
  const rows = await db.dailyUsageArchive.findMany({
    where: { date: { gte: sinceDate } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ date: r.date, requests: r.requests, tokens: r.tokens, cost: r.cost }));
}

/**
 * Rolls up and deletes Request rows older than the configured retention
 * window. No-op unless the user has explicitly set `dataRetentionDays` — the
 * feature defaults to "keep forever" so this never deletes usage history
 * unless asked to.
 *
 * Each day about to be pruned is summed into DailyUsageArchive first
 * (upserted, so a re-run over the same range is safe) — per-request detail
 * is lost, but long-term trend charts keep working past the retention
 * window instead of that history just vanishing. The archive excludes
 * sidechain turns from its totals, matching every other cost/token figure
 * in the app, but deletion itself removes sidechain rows too — they still
 * take up space and were never meant to be kept forever either.
 */
export async function pruneOldRequests(): Promise<number> {
  const db = getDb();
  const days = await getRetentionDays();
  if (!days || days <= 0) return 0;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyTotals = await db.$queryRaw<Array<{ day: string; requests: bigint; tokens: bigint | null; cost: number | null }>>`
    SELECT
      date(timestamp / 1000, 'unixepoch') as day,
      COUNT(*) as requests,
      SUM(inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens) as tokens,
      SUM(cost) as cost
    FROM Request
    WHERE timestamp < ${cutoff.getTime()} AND isSidechain = 0
    GROUP BY day
  `;

  for (const row of dailyTotals) {
    const data = { requests: Number(row.requests), tokens: Number(row.tokens ?? 0), cost: row.cost ?? 0 };
    await db.dailyUsageArchive.upsert({
      where: { date: row.day },
      create: { date: row.day, ...data },
      update: data,
    });
  }

  const result = await db.request.deleteMany({ where: { timestamp: { lt: cutoff } } });
  return result.count;
}
