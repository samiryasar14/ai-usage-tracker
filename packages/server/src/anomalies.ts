import { getDb } from "@ai-usage-tracker/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BASELINE_WINDOW_DAYS = 30;
// Below this many days of history, a baseline mean/stddev is too noisy to
// call anything an "anomaly" rather than just normal early variance.
const MIN_DAYS_FOR_DETECTION = 7;
const Z_SCORE_THRESHOLD = 2;

export interface CostAnomaly {
  date: string;
  cost: number;
  baselineMean: number;
  zScore: number;
}

/**
 * Flags days from the last BASELINE_WINDOW_DAYS whose cost is at least
 * Z_SCORE_THRESHOLD standard deviations above the window's mean daily cost.
 * Only over-baseline spikes are reported — an unusually quiet day isn't
 * actionable the way an unexpected spend spike is. Simple z-score against a
 * flat baseline, not weekday/weekend-conditioned — good enough to catch a
 * real spike without ML infrastructure, per the roadmap's own framing.
 */
export async function getCostAnomalies(): Promise<CostAnomaly[]> {
  const db = getDb();
  const since = Date.now() - BASELINE_WINDOW_DAYS * MS_PER_DAY;
  const rows = await db.$queryRaw<Array<{ day: string; cost: number | null }>>`
    SELECT date(timestamp / 1000, 'unixepoch') as day, SUM(cost) as cost
    FROM Request
    WHERE timestamp >= ${since} AND isSidechain = 0
    GROUP BY day
    ORDER BY day ASC
  `;
  const days = rows.map((r) => ({ date: r.day, cost: r.cost ?? 0 }));
  if (days.length < MIN_DAYS_FOR_DETECTION) return [];

  const costs = days.map((d) => d.cost);
  const mean = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const variance = costs.reduce((sum, c) => sum + (c - mean) ** 2, 0) / costs.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return [];

  return days
    .map((d) => ({
      date: d.date,
      cost: d.cost,
      baselineMean: Math.round(mean * 100) / 100,
      zScore: Math.round(((d.cost - mean) / stdDev) * 100) / 100,
    }))
    .filter((d) => d.zScore >= Z_SCORE_THRESHOLD)
    .sort((a, b) => b.date.localeCompare(a.date));
}
