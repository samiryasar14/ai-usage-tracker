import { watch } from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { getClaudeProjectsDir } from "@ai-usage-tracker/plugin-claude-code";
import { runIngestionCycle } from "./ingest.js";
import {
  getOverview,
  getTimeline,
  getModelLeaderboard,
  getSessionHistory,
  getProjectAnalytics,
} from "./aggregations.js";
import { getAlertRules, setMonthlyBudgetRule, getAlertEvents, checkBudgetAlerts } from "./alerts.js";
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } from "./subscriptions.js";
import { getReportRows, toCsv, type ReportPeriod } from "./reports.js";
import { getMonthlyCostForecast } from "./forecast.js";

const PORT = Number(process.env.PORT ?? 4317);
const INGEST_INTERVAL_MS = 10_000;

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);

const sockets = new Set<import("ws").WebSocket>();

function broadcastRefresh() {
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: "refresh" }));
    }
  }
}

function broadcastAlert(message: string) {
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: "alert", message }));
    }
  }
}

app.get("/ws", { websocket: true }, (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

app.get("/api/overview", async () => getOverview());

app.get<{ Querystring: { days?: string } }>("/api/timeline", async (req) => {
  const days = Number(req.query.days ?? 30);
  return getTimeline(days);
});

app.get("/api/models", async () => getModelLeaderboard());

app.get<{ Querystring: { limit?: string; project?: string; model?: string } }>(
  "/api/sessions",
  async (req) => {
    const limit = Number(req.query.limit ?? 100);
    return getSessionHistory(limit, req.query.project, req.query.model);
  },
);

app.get("/api/projects", async () => getProjectAnalytics());

app.get("/api/alerts/rules", async () => getAlertRules());

app.put<{ Body: { thresholdUsd: number; enabled: boolean } }>("/api/alerts/rules/monthly-budget", async (req) => {
  return setMonthlyBudgetRule(req.body.thresholdUsd, req.body.enabled);
});

app.get<{ Querystring: { limit?: string } }>("/api/alerts/events", async (req) => {
  return getAlertEvents(Number(req.query.limit ?? 20));
});

app.get("/api/forecast", async () => getMonthlyCostForecast());

app.get("/api/subscriptions", async () => listSubscriptions());

app.post<{ Body: { name: string; monthlyCostUsd: number; renewalDay: number; status?: string; notes?: string | null } }>(
  "/api/subscriptions",
  async (req, reply) => {
    const sub = await createSubscription(req.body);
    reply.code(201);
    return sub;
  },
);

app.put<{
  Params: { id: string };
  Body: Partial<{ name: string; monthlyCostUsd: number; renewalDay: number; status: string; notes: string | null }>;
}>("/api/subscriptions/:id", async (req) => {
  return updateSubscription(req.params.id, req.body);
});

app.delete<{ Params: { id: string } }>("/api/subscriptions/:id", async (req, reply) => {
  await deleteSubscription(req.params.id);
  reply.code(204);
});

const VALID_PERIODS: ReportPeriod[] = ["day", "week", "month"];

app.get<{ Querystring: { period?: string; format?: string } }>("/api/reports/export", async (req, reply) => {
  const period = VALID_PERIODS.includes(req.query.period as ReportPeriod)
    ? (req.query.period as ReportPeriod)
    : "month";
  const format = req.query.format === "json" ? "json" : "csv";
  const rows = await getReportRows(period);
  const filename = `ai-usage-hub-${period}-report.${format}`;

  reply.header("Content-Disposition", `attachment; filename="${filename}"`);
  if (format === "json") {
    reply.type("application/json");
    return rows;
  }
  reply.type("text/csv");
  return toCsv(rows);
});

async function ingestAndNotify() {
  try {
    const written = await runIngestionCycle();
    if (written > 0) {
      app.log.info({ written }, "ingested usage records");
      broadcastRefresh();
    }

    const newAlerts = await checkBudgetAlerts();
    for (const alert of newAlerts) {
      app.log.warn({ alert }, "budget alert triggered");
      broadcastAlert(alert.message);
    }
  } catch (err) {
    app.log.error(err, "ingestion cycle failed");
  }
}

await ingestAndNotify();
setInterval(ingestAndNotify, INGEST_INTERVAL_MS);

try {
  watch(getClaudeProjectsDir(), { recursive: true }, () => {
    void ingestAndNotify();
  });
} catch (err) {
  app.log.warn(err, "could not watch Claude Code projects directory; relying on polling only");
}

await app.listen({ port: PORT, host: "127.0.0.1" });
app.log.info(`AI Usage Hub server listening on http://127.0.0.1:${PORT}`);
