import { getModelLeaderboard, getProjectAnalytics } from "./aggregations.js";
import { getMonthlyCostForecast } from "./forecast.js";
import { getCostAnomalies } from "./anomalies.js";

export interface InsightsSummary {
  bullets: string[];
}

const usd = (n: number) => `$${n.toFixed(2)}`;

/**
 * A short "what changed this month" summary composed entirely from figures
 * already computed elsewhere (forecast trend, leaderboard, project
 * analytics, anomalies) — deliberately not an LLM call, so it works without
 * asking the user for yet another API credential and never hallucinates a
 * number the rest of the dashboard doesn't already show.
 */
export async function getInsightsSummary(): Promise<InsightsSummary> {
  const [forecast, models, projects, anomalies] = await Promise.all([
    getMonthlyCostForecast(),
    getModelLeaderboard(),
    getProjectAnalytics(),
    getCostAnomalies(),
  ]);

  const bullets: string[] = [];

  if (forecast.costSoFar > 0 && forecast.trendPercent !== 0) {
    const direction = forecast.trendPercent > 0 ? "up" : "down";
    bullets.push(
      `Spend is trending ${direction} ${Math.abs(forecast.trendPercent)}% vs. the same point last month.`,
    );
  }

  const topModel = models[0];
  if (topModel && forecast.costSoFar > 0) {
    const share = Math.round((topModel.cost / forecast.costSoFar) * 100);
    bullets.push(`${topModel.modelName} is your top model this month at ${usd(topModel.cost)} (${share}% of spend).`);
  }

  const topProject = projects[0];
  if (topProject) {
    bullets.push(
      `${topProject.name} is your most active project — ${topProject.sessions.toLocaleString()} sessions, ${usd(topProject.cost)}.`,
    );
  }

  if (anomalies.length > 0) {
    bullets.push(
      `${anomalies.length} day${anomalies.length === 1 ? "" : "s"} this month had unusually high spend — see Spending anomalies below.`,
    );
  }

  if (forecast.weekdayAverage > 0 && forecast.weekendAverage > 0) {
    const ratio = forecast.weekdayAverage / forecast.weekendAverage;
    if (ratio >= 1.5) bullets.push(`Weekday spend is running ${ratio.toFixed(1)}x your weekend average.`);
  }

  if (bullets.length === 0) {
    bullets.push("Not enough usage yet to summarize trends — check back after a few days of activity.");
  }

  return { bullets };
}
