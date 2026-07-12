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
import {
  getAlertRules,
  setMonthlyBudgetRule,
  getAlertEvents,
  acknowledgeAlertEvent,
  checkBudgetAlerts,
} from "./alerts.js";
import { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } from "./subscriptions.js";
import { getReportRows, toCsv, type ReportPeriod } from "./reports.js";
import { getMonthlyCostForecast } from "./forecast.js";
import { listAssistantMessages, answerAssistantQuestion } from "./assistant.js";
import { getRecommendedProjectLimit } from "./recommendations.js";
import { startPairing, claimPairing, verifyToken, listPairedDevices, revokeDevice } from "./pairing.js";
import { listActivity } from "./activity.js";
import { listTags, createTag, deleteTag, addTagToProject, removeTagFromProject } from "./tags.js";
import { listProjectNotes, addProjectNote, deleteNote } from "./notes.js";
import { listSavedViews, createSavedView, deleteSavedView } from "./savedViews.js";
import { getNews } from "./news.js";
import { getSettings, setSetting, pruneOldRequests, SETTING_KEYS, type SettingKey } from "./settings.js";

const PORT = Number(process.env.PORT ?? 4317);
const INGEST_INTERVAL_MS = 10_000;

// Packaged builds set these to point at a fresh per-user database that's
// never been through `prisma migrate dev`; dev/CI leave them unset and rely
// on the dev database already being migrated. See migrate.ts for why.
if (process.env.RUN_APP_MIGRATIONS === "1") {
  if (!process.env.MIGRATIONS_DIR) {
    throw new Error("RUN_APP_MIGRATIONS=1 requires MIGRATIONS_DIR to be set");
  }
  const { runMigrations } = await import("./migrate.js");
  await runMigrations(process.env.MIGRATIONS_DIR);
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);

// Historically this server only ever bound to 127.0.0.1, so every request
// was implicitly trusted — it's now also LAN-reachable (for the mobile app),
// so requests from anywhere else must present a token from a paired device.
// The pairing-claim route is deliberately exempt: the short-lived pairing
// code IS the secret that gates it, not a bearer token (chicken-and-egg).
const LOOPBACK_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const UNAUTHENTICATED_PATHS = new Set(["/api/pairing/claim"]);

app.addHook("onRequest", async (req, reply) => {
  if (LOOPBACK_IPS.has(req.ip) || UNAUTHENTICATED_PATHS.has(req.url.split("?")[0])) {
    return;
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const device = token ? await verifyToken(token) : null;
  if (!device) {
    reply.code(401).send({ error: "unauthorized" });
  }
});

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

app.patch<{ Params: { id: string } }>("/api/alerts/events/:id/acknowledge", async (req) => {
  return acknowledgeAlertEvent(req.params.id);
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

app.get("/api/assistant/messages", async () => listAssistantMessages());

app.post<{ Body: { content: string } }>("/api/assistant/messages", async (req, reply) => {
  const reply_ = await answerAssistantQuestion(req.body.content);
  reply.code(201);
  return reply_;
});

app.get<{ Params: { id: string } }>("/api/projects/:id/recommendation", async (req) => {
  return getRecommendedProjectLimit(req.params.id);
});

app.post("/api/pairing/start", async () => startPairing(PORT));

app.post<{ Body: { code: string; deviceName: string } }>("/api/pairing/claim", async (req, reply) => {
  try {
    const result = await claimPairing(req.body.code, req.body.deviceName);
    reply.code(201);
    return result;
  } catch (err) {
    reply.code(400);
    return { error: err instanceof Error ? err.message : "Pairing failed" };
  }
});

app.get("/api/pairing/devices", async () => listPairedDevices());

app.delete<{ Params: { id: string } }>("/api/pairing/devices/:id", async (req, reply) => {
  await revokeDevice(req.params.id);
  reply.code(204);
});

app.get<{ Querystring: { limit?: string } }>("/api/activity", async (req) => {
  return listActivity(Number(req.query.limit ?? 50));
});

app.get("/api/tags", async () => listTags());

app.post<{ Body: { name: string; color: string } }>("/api/tags", async (req, reply) => {
  const tag = await createTag(req.body.name, req.body.color);
  reply.code(201);
  return tag;
});

app.delete<{ Params: { id: string } }>("/api/tags/:id", async (req, reply) => {
  await deleteTag(req.params.id);
  reply.code(204);
});

app.post<{ Params: { id: string; tagId: string } }>("/api/projects/:id/tags/:tagId", async (req, reply) => {
  await addTagToProject(req.params.id, req.params.tagId);
  reply.code(204);
});

app.delete<{ Params: { id: string; tagId: string } }>("/api/projects/:id/tags/:tagId", async (req, reply) => {
  await removeTagFromProject(req.params.id, req.params.tagId);
  reply.code(204);
});

app.get<{ Params: { id: string } }>("/api/projects/:id/notes", async (req) => {
  return listProjectNotes(req.params.id);
});

app.post<{ Params: { id: string }; Body: { content: string } }>("/api/projects/:id/notes", async (req, reply) => {
  const note = await addProjectNote(req.params.id, req.body.content);
  reply.code(201);
  return note;
});

app.delete<{ Params: { id: string } }>("/api/notes/:id", async (req, reply) => {
  await deleteNote(req.params.id);
  reply.code(204);
});

app.get<{ Querystring: { viewType?: string } }>("/api/saved-views", async (req) => {
  return listSavedViews(req.query.viewType);
});

app.post<{ Body: { name: string; viewType: string; filterConfig: string } }>("/api/saved-views", async (req, reply) => {
  const view = await createSavedView(req.body.name, req.body.viewType, req.body.filterConfig);
  reply.code(201);
  return view;
});

app.delete<{ Params: { id: string } }>("/api/saved-views/:id", async (req, reply) => {
  await deleteSavedView(req.params.id);
  reply.code(204);
});

app.get<{ Querystring: { limit?: string; force?: string } }>("/api/news", async (req) => {
  return getNews(Number(req.query.limit ?? 20), req.query.force === "1");
});

app.get("/api/settings", async () => getSettings());

app.put<{ Params: { key: string }; Body: { value: string } }>("/api/settings/:key", async (req, reply) => {
  if (!SETTING_KEYS.includes(req.params.key as SettingKey)) {
    reply.code(400);
    return { error: `Unknown setting key: ${req.params.key}` };
  }
  await setSetting(req.params.key as SettingKey, req.body.value);
  return getSettings();
});

const VALID_PERIODS: ReportPeriod[] = ["day", "week", "month"];

app.get<{ Querystring: { period?: string; format?: string } }>("/api/reports/export", async (req, reply) => {
  const period = VALID_PERIODS.includes(req.query.period as ReportPeriod)
    ? (req.query.period as ReportPeriod)
    : "month";
  const format = req.query.format === "json" ? "json" : "csv";
  const rows = await getReportRows(period);
  const filename = `soar-ai-tracker-${period}-report.${format}`;

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

    const pruned = await pruneOldRequests();
    if (pruned > 0) {
      app.log.info({ pruned }, "pruned requests past the configured retention window");
      broadcastRefresh();
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

await app.listen({ port: PORT, host: "0.0.0.0" });
app.log.info(`Soar AI Tracker server listening on http://127.0.0.1:${PORT} (and the LAN, for paired mobile devices)`);
