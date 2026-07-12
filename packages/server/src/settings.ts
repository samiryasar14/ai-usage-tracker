import { getDb } from "@ai-usage-tracker/db";

// Keys understood by the dashboard's Settings page. Values are always
// stored/returned as strings — callers parse numbers/booleans themselves.
export const SETTING_KEYS = [
  "dataRetentionDays",
  "notifyOnBudgetAlert",
  "defaultReportPeriod",
  "defaultReportFormat",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: SettingKey, value: string) {
  const db = getDb();
  return db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/**
 * Deletes Request rows older than the configured retention window. No-op
 * unless the user has explicitly set `dataRetentionDays` — the feature
 * defaults to "keep forever" so this never deletes usage history unless
 * asked to.
 */
export async function pruneOldRequests(): Promise<number> {
  const db = getDb();
  const setting = await db.setting.findUnique({ where: { key: "dataRetentionDays" } });
  const days = setting ? Number(setting.value) : 0;
  if (!days || days <= 0) return 0;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db.request.deleteMany({ where: { timestamp: { lt: cutoff } } });
  return result.count;
}
