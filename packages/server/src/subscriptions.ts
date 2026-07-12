import { getDb } from "@ai-usage-tracker/db";
import { logActivity } from "./activity.js";

export interface SubscriptionInput {
  name: string;
  monthlyCostUsd: number;
  renewalDay: number;
  status?: string;
  notes?: string | null;
}

export async function listSubscriptions() {
  const db = getDb();
  return db.subscription.findMany({ orderBy: { createdAt: "asc" } });
}

/** Combined monthly cost of every active (non-cancelled) subscription. */
export async function getActiveSubscriptionsMonthlyTotal(): Promise<number> {
  const db = getDb();
  const active = await db.subscription.findMany({ where: { status: "active" }, select: { monthlyCostUsd: true } });
  return active.reduce((sum, s) => sum + s.monthlyCostUsd, 0);
}

export async function createSubscription(input: SubscriptionInput) {
  const db = getDb();
  const subscription = await db.subscription.create({
    data: {
      name: input.name,
      monthlyCostUsd: input.monthlyCostUsd,
      renewalDay: input.renewalDay,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    },
  });
  await logActivity(
    "subscription_added",
    `Added subscription "${input.name}" ($${input.monthlyCostUsd.toFixed(2)}/mo)`,
  );
  return subscription;
}

export async function updateSubscription(id: string, input: Partial<SubscriptionInput>) {
  const db = getDb();
  return db.subscription.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.monthlyCostUsd !== undefined ? { monthlyCostUsd: input.monthlyCostUsd } : {}),
      ...(input.renewalDay !== undefined ? { renewalDay: input.renewalDay } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deleteSubscription(id: string) {
  const db = getDb();
  const subscription = await db.subscription.findUnique({ where: { id } });
  await db.subscription.delete({ where: { id } });
  if (subscription) {
    await logActivity("subscription_removed", `Removed subscription "${subscription.name}"`);
  }
}
