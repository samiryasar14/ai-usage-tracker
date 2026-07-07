import { getDb } from "@ai-usage-tracker/db";
import { getOverview, getModelLeaderboard, getProjectAnalytics } from "./aggregations.js";
import { getMonthlyCostForecast } from "./forecast.js";
import { getRecommendedProjectLimit } from "./recommendations.js";

const FALLBACK_REPLY =
  "I can help with your monthly spend, most-used model, cost forecast, or a recommended budget for a specific project — try asking about one of those!";

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Finds the project whose name best substring-matches the question, in either direction. */
function findMentionedProject<T extends { name: string }>(question: string, projects: T[]): T | undefined {
  return projects.find(
    (p) => question.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(question),
  );
}

async function generateReply(content: string): Promise<string> {
  const q = content.toLowerCase();

  // Checked first (and most specific): recommend/budget/limit only resolves when a
  // project name is also mentioned. If the keyword is present but no project matches,
  // that's still a "can't help with this" case, so we go straight to the fallback
  // rather than let a broader intent (e.g. "spend") swallow the question instead.
  if (/recommend|budget|limit/.test(q)) {
    const projects = await getProjectAnalytics();
    const match = findMentionedProject(q, projects);
    if (!match) return FALLBACK_REPLY;
    const recommendation = await getRecommendedProjectLimit(match.projectId);
    return `${recommendation.reasoning} Recommended monthly budget: ${usd(recommendation.recommendedMonthlyUsd)}.`;
  }

  if (/forecast|projected|end of month/.test(q)) {
    const forecast = await getMonthlyCostForecast();
    return `Based on your spend so far this month, I'm projecting a total of ${usd(forecast.projectedMonthlyCost)} by the end of the month.`;
  }

  if (/model/.test(q)) {
    const leaderboard = await getModelLeaderboard();
    const top = leaderboard[0];
    if (top) {
      return `Your most-used model by cost is ${top.modelName}, with ${usd(top.cost)} spent across ${top.calls} calls.`;
    }
  }

  if (/spend|cost|this month/.test(q)) {
    const overview = await getOverview();
    return `Your estimated spend this month is ${usd(overview.estimatedMonthlyCost)}.`;
  }

  return FALLBACK_REPLY;
}

export async function listAssistantMessages() {
  const db = getDb();
  return db.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
}

export async function answerAssistantQuestion(content: string) {
  const db = getDb();
  await db.chatMessage.create({ data: { role: "user", content } });

  const replyText = await generateReply(content);

  return db.chatMessage.create({ data: { role: "assistant", content: replyText } });
}
