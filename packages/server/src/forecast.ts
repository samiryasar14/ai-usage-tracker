import { getDb } from "@ai-usage-tracker/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Projects the current month's total spend by extrapolating the daily average
 * so far. A simple linear extrapolation, not a trend/seasonality model — good
 * enough for "how much will this month cost" at this data volume.
 */
export async function getMonthlyCostForecast() {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const totalDays = daysInMonth(now.getUTCFullYear(), now.getUTCMonth());

  const agg = await db.request.aggregate({
    where: { timestamp: { gte: monthStart } },
    _sum: { cost: true },
  });
  const costSoFar = agg._sum.cost ?? 0;

  // Clamp elapsed time to at least half a day so the projection doesn't
  // wildly overshoot in the first few hours of a new month.
  const elapsedDays = Math.max((now.getTime() - monthStart.getTime()) / MS_PER_DAY, 0.5);
  const dailyAverage = costSoFar / elapsedDays;
  const projectedMonthlyCost = dailyAverage * totalDays;

  return {
    costSoFar,
    dailyAverage,
    projectedMonthlyCost,
    elapsedDays: Math.round(elapsedDays * 10) / 10,
    totalDays,
  };
}
