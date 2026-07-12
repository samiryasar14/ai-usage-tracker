import { getDb } from "@ai-usage-tracker/db";
import PDFDocument from "pdfkit";

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
    where: { timestamp: { gte: since }, isSidechain: false },
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

export interface ReportSummary {
  period: ReportPeriod;
  since: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byModel: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  byProject: Array<{ project: string; requests: number; tokens: number; cost: number }>;
}

/**
 * A raw per-request dump doesn't make a readable PDF at any real data
 * volume, so the PDF export is a summary — totals plus cost broken down by
 * model and project — rather than the row-level CSV/JSON exports.
 */
export async function getReportSummary(period: ReportPeriod): Promise<ReportSummary> {
  const rows = await getReportRows(period);
  const rowTokens = (r: ReportRow) => r.inputTokens + r.outputTokens + r.cacheReadTokens + r.cacheCreationTokens;

  const byModel = new Map<string, { requests: number; tokens: number; cost: number }>();
  const byProject = new Map<string, { requests: number; tokens: number; cost: number }>();
  let totalTokens = 0;
  let totalCost = 0;

  for (const row of rows) {
    const tokens = rowTokens(row);
    totalTokens += tokens;
    totalCost += row.cost;

    const model = byModel.get(row.model) ?? { requests: 0, tokens: 0, cost: 0 };
    model.requests++;
    model.tokens += tokens;
    model.cost += row.cost;
    byModel.set(row.model, model);

    const project = byProject.get(row.project) ?? { requests: 0, tokens: 0, cost: 0 };
    project.requests++;
    project.tokens += tokens;
    project.cost += row.cost;
    byProject.set(row.project, project);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    period,
    since: periodStart(period).toISOString(),
    totalRequests: rows.length,
    totalTokens,
    totalCost: round2(totalCost),
    byModel: [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v, cost: round2(v.cost) }))
      .sort((a, b) => b.cost - a.cost),
    byProject: [...byProject.entries()]
      .map(([project, v]) => ({ project, ...v, cost: round2(v.cost) }))
      .sort((a, b) => b.cost - a.cost),
  };
}

export function toPdfBuffer(summary: ReportSummary): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Soar AI Tracker — Usage Report");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(`Period: ${summary.period} (since ${new Date(summary.since).toLocaleDateString()})`)
      .text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fillColor("#000000").fontSize(14).text("Summary");
    doc.fontSize(11).moveDown(0.3);
    doc.text(`Total requests: ${summary.totalRequests.toLocaleString()}`);
    doc.text(`Total tokens: ${summary.totalTokens.toLocaleString()}`);
    doc.text(`Total cost: $${summary.totalCost.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text("By model");
    doc.fontSize(10).moveDown(0.3);
    if (summary.byModel.length === 0) doc.fillColor("#666666").text("No usage recorded for this period.");
    for (const m of summary.byModel) {
      doc
        .fillColor("#000000")
        .text(`${m.model} — ${m.requests.toLocaleString()} requests, ${m.tokens.toLocaleString()} tokens, $${m.cost.toFixed(2)}`);
    }
    doc.moveDown();

    doc.fontSize(14).text("By project");
    doc.fontSize(10).moveDown(0.3);
    if (summary.byProject.length === 0) doc.fillColor("#666666").text("No usage recorded for this period.");
    for (const p of summary.byProject) {
      doc
        .fillColor("#000000")
        .text(`${p.project} — ${p.requests.toLocaleString()} requests, ${p.tokens.toLocaleString()} tokens, $${p.cost.toFixed(2)}`);
    }

    doc.end();
  });
}
