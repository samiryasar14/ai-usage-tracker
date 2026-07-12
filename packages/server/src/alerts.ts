import { getDb, Prisma } from "@ai-usage-tracker/db";
import { logActivity } from "./activity.js";

export type AlertRuleType = "monthly_budget" | "daily_budget";
export type AlertRuleScope = "global" | "project" | "model";

export interface AlertRuleInput {
  type: AlertRuleType;
  scope: AlertRuleScope;
  scopeId?: string | null;
  thresholdUsd: number;
  enabled?: boolean;
}

function periodStartFor(type: AlertRuleType): Date {
  const now = new Date();
  return type === "daily_budget"
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function currentPeriodKey(type: AlertRuleType): string {
  const now = new Date();
  return type === "daily_budget"
    ? now.toISOString().slice(0, 10)
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getScopedSpend(scope: AlertRuleScope, scopeId: string | null, periodStart: Date): Promise<number> {
  const db = getDb();
  const scopeFilter =
    scope === "project" && scopeId
      ? { session: { projectId: scopeId } }
      : scope === "model" && scopeId
        ? { model: { name: scopeId } }
        : {};
  const agg = await db.request.aggregate({
    where: { timestamp: { gte: periodStart }, isSidechain: false, ...scopeFilter },
    _sum: { cost: true },
  });
  return agg._sum.cost ?? 0;
}

/** Human-readable scope suffix for alert messages — only resolved right before creating a new event, not on every check. */
async function getScopeLabel(scope: AlertRuleScope, scopeId: string | null): Promise<string> {
  if (scope === "global" || !scopeId) return "";
  if (scope === "project") {
    const db = getDb();
    const project = await db.project.findUnique({ where: { id: scopeId }, select: { name: true } });
    return project ? ` for project "${project.name}"` : "";
  }
  return ` for model "${scopeId}"`;
}

export async function getAlertRules() {
  const db = getDb();
  return db.alertRule.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createAlertRule(input: AlertRuleInput) {
  const db = getDb();
  return db.alertRule.create({
    data: {
      type: input.type,
      scope: input.scope,
      scopeId: input.scope === "global" ? null : (input.scopeId ?? null),
      thresholdUsd: input.thresholdUsd,
      enabled: input.enabled ?? true,
    },
  });
}

export async function updateAlertRule(id: string, input: Partial<AlertRuleInput>) {
  const db = getDb();
  return db.alertRule.update({
    where: { id },
    data: {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scope === "global" ? null : input.scopeId } : {}),
      ...(input.thresholdUsd !== undefined ? { thresholdUsd: input.thresholdUsd } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    },
  });
}

export async function deleteAlertRule(id: string) {
  const db = getDb();
  await db.alertRule.delete({ where: { id } });
}

export async function getAlertEvents(limit: number) {
  const db = getDb();
  return db.alertEvent.findMany({
    orderBy: { triggeredAt: "desc" },
    take: limit,
    include: { rule: true },
  });
}

export async function acknowledgeAlertEvent(id: string) {
  const db = getDb();
  return db.alertEvent.update({ where: { id }, data: { acknowledgedAt: new Date() } });
}

// Fraction of the budget that counts as "approaching" — a softer heads-up
// before the hard exceeded alert.
const APPROACHING_THRESHOLD_RATIO = 0.8;

/**
 * Checks every enabled budget rule (any scope, monthly or daily) against its
 * scoped spend and records a new AlertEvent for any that just crossed their
 * threshold this period. Safe to call every ingestion cycle — the
 * (ruleId, periodKey) unique constraint means a rule that already fired this
 * period is silently skipped, not re-alerted.
 */
export async function checkBudgetAlerts(): Promise<Array<{ message: string }>> {
  const db = getDb();
  const notifications: Array<{ message: string }> = [];

  const rules = await db.alertRule.findMany({ where: { enabled: true } });
  for (const rule of rules) {
    const type = rule.type as AlertRuleType;
    const scope = rule.scope as AlertRuleScope;
    const periodKey = currentPeriodKey(type);
    const periodStart = periodStartFor(type);
    const spend = await getScopedSpend(scope, rule.scopeId, periodStart);
    const periodLabel = type === "daily_budget" ? "Daily" : "Monthly";

    if (spend >= rule.thresholdUsd) {
      try {
        const scopeLabel = await getScopeLabel(scope, rule.scopeId);
        const event = await db.alertEvent.create({
          data: {
            ruleId: rule.id,
            periodKey,
            message: `${periodLabel} spend $${spend.toFixed(2)}${scopeLabel} has exceeded the $${rule.thresholdUsd.toFixed(2)} budget.`,
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
        const scopeLabel = await getScopeLabel(scope, rule.scopeId);
        const event = await db.alertEvent.create({
          data: {
            ruleId: rule.id,
            periodKey: `${periodKey}-approaching`,
            message: `${periodLabel} spend $${spend.toFixed(2)}${scopeLabel} is approaching the $${rule.thresholdUsd.toFixed(2)} budget (${Math.round((spend / rule.thresholdUsd) * 100)}%).`,
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

  const globalMonthKey = currentPeriodKey("monthly_budget");
  const alreadyNotifiedReset = await db.activityEvent.findFirst({
    where: { type: "period_reset", message: { contains: globalMonthKey } },
  });
  if (!alreadyNotifiedReset) {
    const message = `A new budget period (${globalMonthKey}) has started.`;
    await logActivity("period_reset", message);
    notifications.push({ message });
  }

  return notifications;
}
