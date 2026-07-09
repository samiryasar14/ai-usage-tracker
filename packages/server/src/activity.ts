import { getDb } from "@ai-usage-tracker/db";

export async function logActivity(type: string, message: string): Promise<void> {
  const db = getDb();
  await db.activityEvent.create({ data: { type, message } });
}

export async function listActivity(limit: number) {
  const db = getDb();
  return db.activityEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
