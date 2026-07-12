import { getDb } from "@ai-usage-tracker/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const HALF_WINDOW_DAYS = WINDOW_DAYS / 2;

const BASE_MARGIN = 0.2;
const MIN_MARGIN = 0.1;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Recommends a monthly budget for a project from its own trailing 30-day
 * spend — no forecasting model, just a trailing average plus a headroom
 * margin that grows a bit when spend is trending up. Good enough to give
 * the user a grounded starting point, not a prediction.
 */
export async function getRecommendedProjectLimit(projectId: string): Promise<{
  recommendedMonthlyUsd: number;
  reasoning: string;
  trailingAverageUsd: number;
  trendPercent: number;
}> {
  const db = getDb();

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY);
  const midpoint = new Date(now.getTime() - HALF_WINDOW_DAYS * MS_PER_DAY);

  const requests = await db.request.findMany({
    where: { session: { projectId }, timestamp: { gte: thirtyDaysAgo }, isSidechain: false },
    select: { cost: true, timestamp: true },
  });

  const trailingAverageUsd = requests.reduce((sum, r) => sum + r.cost, 0);

  if (trailingAverageUsd === 0) {
    return {
      recommendedMonthlyUsd: 0,
      trailingAverageUsd: 0,
      trendPercent: 0,
      reasoning: `Not enough usage history for ${project.name} yet — check back after a few days of activity to get a recommendation.`,
    };
  }

  let firstHalfTotal = 0;
  let secondHalfTotal = 0;
  for (const r of requests) {
    if (r.timestamp.getTime() < midpoint.getTime()) {
      firstHalfTotal += r.cost;
    } else {
      secondHalfTotal += r.cost;
    }
  }

  const firstHalfAvgDaily = firstHalfTotal / HALF_WINDOW_DAYS;
  const secondHalfAvgDaily = secondHalfTotal / HALF_WINDOW_DAYS;

  let trendPercent: number;
  if (firstHalfAvgDaily === 0) {
    trendPercent = secondHalfAvgDaily === 0 ? 0 : 100;
  } else {
    trendPercent = ((secondHalfAvgDaily - firstHalfAvgDaily) / firstHalfAvgDaily) * 100;
  }

  const trendMargin = trendPercent > 0 ? trendPercent / 2 / 100 : 0;
  const margin = Math.max(BASE_MARGIN + trendMargin, MIN_MARGIN);
  const recommendedMonthlyUsd = round2(trailingAverageUsd * (1 + margin));

  const reasoning = `Based on ${project.name}'s last 30 days ($${trailingAverageUsd.toFixed(2)}, trending ${
    trendPercent >= 0 ? "up" : "down"
  } ${Math.abs(trendPercent).toFixed(0)}%), a monthly limit of $${recommendedMonthlyUsd.toFixed(2)} gives headroom without being unbounded.`;

  return {
    recommendedMonthlyUsd,
    trailingAverageUsd,
    trendPercent,
    reasoning,
  };
}
