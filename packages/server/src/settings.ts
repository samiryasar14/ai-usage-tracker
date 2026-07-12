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

/** The configured retention window in days, or 0 if unset ("keep forever"). See archive.ts for how this is enforced. */
export async function getRetentionDays(): Promise<number> {
  const db = getDb();
  const setting = await db.setting.findUnique({ where: { key: "dataRetentionDays" } });
  return setting ? Number(setting.value) : 0;
}
