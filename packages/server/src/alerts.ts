import { getDb } from "@ai-usage-tracker/db";
import { Prisma } from "@ai-usage-tracker/db";
import { logActivity } from "./activity.js";

function currentMonthSpendWhere() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getCurrentMonthSpend(): Promise<number> {
  const db = getDb();
  const monthStart = currentMonthSpendWhere();
  const agg = await db.request.aggregate({
    where: { timestamp: { gte: monthStart } },
    _sum: { cost: true },
  });
  return agg._sum.cost ?? 0;
}

export async function getAlertRules() {
  const db = getDb();
  return db.alertRule.findMany({ orderBy: { createdAt: "asc" } });
}

/** Only one "monthly_budget" rule is supported for now — create it if absent, otherwise update it. */
export async function setMonthlyBudgetRule(thresholdUsd: number, enabled: boolean) {
  const db = getDb();
  const existing = await db.alertRule.findFirst({ where: { type: "monthly_budget" } });
  if (existing) {
    return db.alertRule.update({ where: { id: existing.id }, data: { thresholdUsd, enabled } });
  }
  return db.alertRule.create({ data: { type: "monthly_budget", thresholdUsd, enabled } });
}

export async function getAlertEvents(limit: number) {
  const db = getDb();
  return db.alertEvent.findMany({
    orderBy: { triggeredAt: "desc" },
    take: limit,
    include: { rule: true },
  });
}

/**
 * Checks all enabled budget rules against current spend and records a new
 * AlertEvent for any that just crossed their threshold this period. Safe to
 * call every ingestion cycle — the (ruleId, periodKey) unique constraint means
 * a rule that already fired this month is silently skipped, not re-alerted.
 */
export async function checkBudgetAlerts() {
  const db = getDb();
  const rules = await db.alertRule.findMany({ where: { type: "monthly_budget", enabled: true } });
  if (rules.length === 0) return [];

  const spend = await getCurrentMonthSpend();
  const periodKey = currentPeriodKey();
  const newEvents = [];

  for (const rule of rules) {
    if (spend < rule.thresholdUsd) continue;
    try {
      const event = await db.alertEvent.create({
        data: {
          ruleId: rule.id,
          periodKey,
          message: `Monthly spend $${spend.toFixed(2)} has exceeded the $${rule.thresholdUsd.toFixed(2)} budget.`,
        },
      });
      await logActivity("alert_triggered", event.message);
      newEvents.push(event);
    } catch (err) {
      // P2002 = unique constraint violation on (ruleId, periodKey) — already alerted this period.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
        throw err;
      }
    }
  }

  return newEvents;
}
