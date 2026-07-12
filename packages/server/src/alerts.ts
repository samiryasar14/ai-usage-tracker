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
    where: { timestamp: { gte: monthStart }, isSidechain: false },
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

// Fraction of the budget that counts as "approaching" — a softer heads-up
// before the hard exceeded alert.
const APPROACHING_THRESHOLD_RATIO = 0.8;

/**
 * Checks all enabled budget rules against current spend and records a new
 * AlertEvent for any that just crossed their threshold this period. Safe to
 * call every ingestion cycle — the (ruleId, periodKey) unique constraint means
 * a rule that already fired this month is silently skipped, not re-alerted.
 *
 * Also checks a softer "approaching" threshold (80% of budget) and whether a
 * new calendar month just started — both are notification-worthy but don't
 * fit the per-rule AlertEvent shape exactly, so they're folded into the same
 * returned array as plain `{ message }` objects. Every caller (currently just
 * the ingestion loop in index.ts) already just broadcasts `.message` for each
 * returned item, so this needs no changes on that end.
 */
export async function checkBudgetAlerts(): Promise<Array<{ message: string }>> {
  const db = getDb();
  const periodKey = currentPeriodKey();
  const notifications: Array<{ message: string }> = [];

  const rules = await db.alertRule.findMany({ where: { type: "monthly_budget", enabled: true } });
  if (rules.length > 0) {
    const spend = await getCurrentMonthSpend();

    for (const rule of rules) {
      if (spend >= rule.thresholdUsd) {
        try {
          const event = await db.alertEvent.create({
            data: {
              ruleId: rule.id,
              periodKey,
              message: `Monthly spend $${spend.toFixed(2)} has exceeded the $${rule.thresholdUsd.toFixed(2)} budget.`,
            },
          });
          await logActivity("alert_triggered", event.message);
          notifications.push(event);
        } catch (err) {
          // P2002 = unique constraint violation on (ruleId, periodKey) — already alerted this period.
          if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
            throw err;
          }
        }
      } else if (spend >= rule.thresholdUsd * APPROACHING_THRESHOLD_RATIO) {
        // Distinct periodKey suffix reuses the same (ruleId, periodKey) unique
        // constraint to dedupe "approaching" separately from "exceeded" —
        // avoids a schema change for what's otherwise the same shape.
        try {
          const event = await db.alertEvent.create({
            data: {
              ruleId: rule.id,
              periodKey: `${periodKey}-approaching`,
              message: `Monthly spend $${spend.toFixed(2)} is approaching the $${rule.thresholdUsd.toFixed(2)} budget (${Math.round((spend / rule.thresholdUsd) * 100)}%).`,
            },
          });
          await logActivity("budget_approaching", event.message);
          notifications.push(event);
        } catch (err) {
          if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
            throw err;
          }
        }
      }
    }
  }

  const alreadyNotifiedReset = await db.activityEvent.findFirst({
    where: { type: "period_reset", message: { contains: periodKey } },
  });
  if (!alreadyNotifiedReset) {
    const message = `A new budget period (${periodKey}) has started.`;
    await logActivity("period_reset", message);
    notifications.push({ message });
  }

  return notifications;
}
