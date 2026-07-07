import { getDb } from "@ai-usage-tracker/db";

export type ReportPeriod = "day" | "week" | "month";

function periodStart(period: ReportPeriod): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    case "week":
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}

export interface ReportRow {
  timestamp: string;
  provider: string;
  project: string;
  projectPath: string;
  sessionId: string;
  model: string;
  entrypoint: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  cost: number;
}

export async function getReportRows(period: ReportPeriod): Promise<ReportRow[]> {
  const db = getDb();
  const since = periodStart(period);

  const requests = await db.request.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
    include: {
      model: { include: { provider: true } },
      session: { include: { project: true } },
    },
  });

  return requests.map((r) => ({
    timestamp: r.timestamp.toISOString(),
    provider: r.model.provider.name,
    project: r.session.project.name,
    projectPath: r.session.project.path,
    sessionId: r.session.externalId,
    model: r.model.name,
    entrypoint: r.session.entrypoint,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheCreationTokens: r.cacheCreationTokens,
    cost: r.cost,
  }));
}

const CSV_COLUMNS: (keyof ReportRow)[] = [
  "timestamp",
  "provider",
  "project",
  "projectPath",
  "sessionId",
  "model",
  "entrypoint",
  "inputTokens",
  "outputTokens",
  "cacheReadTokens",
  "cacheCreationTokens",
  "cost",
];

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: ReportRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) => CSV_COLUMNS.map((col) => csvEscape(row[col])).join(","));
  return [header, ...lines].join("\n");
}
