import { getDb } from "@ai-usage-tracker/db";

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

export async function createSubscription(input: SubscriptionInput) {
  const db = getDb();
  return db.subscription.create({
    data: {
      name: input.name,
      monthlyCostUsd: input.monthlyCostUsd,
      renewalDay: input.renewalDay,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    },
  });
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
  await db.subscription.delete({ where: { id } });
}
