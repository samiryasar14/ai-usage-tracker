import { getDb } from "@ai-usage-tracker/db";
import { getActiveSubscriptionsMonthlyTotal } from "./subscriptions.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getDailyCostsByDate(sinceMs: number, untilMs: number): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db.$queryRaw<Array<{ day: string; cost: number | null }>>`
    SELECT date(timestamp / 1000, 'unixepoch') as day, SUM(cost) as cost
    FROM Request
    WHERE timestamp >= ${sinceMs} AND timestamp < ${untilMs} AND isSidechain = 0
    GROUP BY day
  `;
  return new Map(rows.map((r) => [r.day, r.cost ?? 0]));
}

/**
 * Projects the current month's total spend. Complete elapsed days (not
 * today, which is still partial) are bucketed by weekday vs weekend; once
 * both buckets have at least one day of data, remaining full days are
 * projected using the matching bucket's average instead of a single flat
 * daily average — a coding habit that's quiet on weekends would otherwise
 * get its weekend days overprojected. Falls back to a flat average (the
 * original behavior) until there's enough of a mix to weight by day type.
 */
export async function getMonthlyCostForecast() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const totalDays = daysInMonth(now.getUTCFullYear(), now.getUTCMonth());

  // Clamp elapsed time to at least half a day so the projection doesn't
  // wildly overshoot in the first few hours of a new month.
  const elapsedDays = Math.max((now.getTime() - monthStart.getTime()) / MS_PER_DAY, 0.5);
  const completedDays = Math.floor(elapsedDays);

  const costByDate = await getDailyCostsByDate(monthStart.getTime(), now.getTime());
  const costSoFar = [...costByDate.values()].reduce((sum, c) => sum + c, 0);
  const dailyAverage = costSoFar / elapsedDays;

  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;
  for (let i = 0; i < completedDays; i++) {
    const date = new Date(monthStart.getTime() + i * MS_PER_DAY);
    const cost = costByDate.get(dateKey(date)) ?? 0;
    if (isWeekend(date)) {
      weekendTotal += cost;
      weekendCount++;
    } else {
      weekdayTotal += cost;
      weekdayCount++;
    }
  }
  const weekdayAverage = weekdayCount > 0 ? weekdayTotal / weekdayCount : dailyAverage;
  const weekendAverage = weekendCount > 0 ? weekendTotal / weekendCount : dailyAverage;
  const haveBothDayTypes = weekdayCount > 0 && weekendCount > 0;

  // Today's partial cost is already in costSoFar — project only full future
  // days (tomorrow through end of month) on top of it.
  let projectedRemaining = 0;
  for (let i = completedDays + 1; i < totalDays; i++) {
    const date = new Date(monthStart.getTime() + i * MS_PER_DAY);
    projectedRemaining += haveBothDayTypes ? (isWeekend(date) ? weekendAverage : weekdayAverage) : dailyAverage;
  }
  const projectedMonthlyCost = costSoFar + projectedRemaining;

  // Month-over-month: last month's spend through the same number of elapsed days.
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthSamePoint = new Date(lastMonthStart.getTime() + elapsedDays * MS_PER_DAY);
  const lastMonthCostByDate = await getDailyCostsByDate(
    lastMonthStart.getTime(),
    Math.min(lastMonthSamePoint.getTime(), monthStart.getTime()),
  );
  const lastMonthCostSoFar = [...lastMonthCostByDate.values()].reduce((sum, c) => sum + c, 0);
  const trendPercent =
    lastMonthCostSoFar > 0 ? ((costSoFar - lastMonthCostSoFar) / lastMonthCostSoFar) * 100 : costSoFar > 0 ? 100 : 0;

  // Subscriptions bill their full monthly amount regardless of usage, so by
  // month-end the whole fee will have been charged — unlike usage cost,
  // there's nothing to project here beyond the current active total.
  const subscriptionCost = await getActiveSubscriptionsMonthlyTotal();

  return {
    costSoFar,
    dailyAverage,
    projectedMonthlyCost,
    subscriptionCost,
    totalProjectedCost: Math.round((projectedMonthlyCost + subscriptionCost) * 100) / 100,
    elapsedDays: Math.round(elapsedDays * 10) / 10,
    totalDays,
    trendPercent: Math.round(trendPercent * 10) / 10,
    weekdayAverage: Math.round(weekdayAverage * 100) / 100,
    weekendAverage: Math.round(weekendAverage * 100) / 100,
  };
}
