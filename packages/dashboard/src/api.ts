const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:4317";

export interface UnpricedModel {
  name: string;
  requestCount: number;
}

export interface Overview {
  todayRequests: number;
  todayTokens: number;
  monthlyTokens: number;
  estimatedMonthlyCost: number;
  modelsUsed: number;
  providersConnected: number;
  unpricedModels: UnpricedModel[];
}

export interface TimelineDay {
  day: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ModelLeaderboardRow {
  modelName: string;
  calls: number;
  tokens: number;
  cost: number;
}

export interface SessionHistoryRow {
  timestamp: string;
  project: string;
  projectPath: string;
  sessionId: string;
  model: string;
  tokens: number;
  cost: number;
}

export interface ProjectAnalyticsRow {
  projectId: string;
  name: string;
  path: string;
  requests: number;
  tokens: number;
  cost: number;
  sessions: number;
  lastActiveAt: string | null;
}

export interface AlertRule {
  id: string;
  type: string;
  thresholdUsd: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  periodKey: string;
  triggeredAt: string;
  message: string;
  acknowledgedAt: string | null;
}

export interface Subscription {
  id: string;
  name: string;
  monthlyCostUsd: number;
  renewalDay: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInput {
  name: string;
  monthlyCostUsd: number;
  renewalDay: number;
  status?: string;
  notes?: string | null;
}

export interface MonthlyCostForecast {
  costSoFar: number;
  dailyAverage: number;
  projectedMonthlyCost: number;
  elapsedDays: number;
  totalDays: number;
}

export type ReportPeriod = "day" | "week" | "month";
export type ReportFormat = "csv" | "json";

export interface ChatMessageDto {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ProjectRecommendation {
  recommendedMonthlyUsd: number;
  reasoning: string;
  trailingAverageUsd: number;
  trendPercent: number;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
}

export function reportExportUrl(period: ReportPeriod, format: ReportFormat): string {
  return `${API_BASE}/api/reports/export?period=${period}&format=${format}`;
}

export const api = {
  overview: () => getJson<Overview>("/api/overview"),
  timeline: (days = 30) => getJson<TimelineDay[]>(`/api/timeline?days=${days}`),
  models: () => getJson<ModelLeaderboardRow[]>("/api/models"),
  sessions: (limit = 100) => getJson<SessionHistoryRow[]>(`/api/sessions?limit=${limit}`),
  projects: () => getJson<ProjectAnalyticsRow[]>("/api/projects"),
  alertRules: () => getJson<AlertRule[]>("/api/alerts/rules"),
  alertEvents: (limit = 20) => getJson<AlertEvent[]>(`/api/alerts/events?limit=${limit}`),
  setMonthlyBudget: (thresholdUsd: number, enabled: boolean) =>
    putJson<AlertRule>("/api/alerts/rules/monthly-budget", { thresholdUsd, enabled }),
  forecast: () => getJson<MonthlyCostForecast>("/api/forecast"),
  subscriptions: () => getJson<Subscription[]>("/api/subscriptions"),
  createSubscription: (input: SubscriptionInput) => postJson<Subscription>("/api/subscriptions", input),
  deleteSubscription: (id: string) => del(`/api/subscriptions/${id}`),
  assistantMessages: () => getJson<ChatMessageDto[]>("/api/assistant/messages"),
  sendAssistantMessage: (content: string) =>
    postJson<ChatMessageDto>("/api/assistant/messages", { content }),
  projectRecommendation: (projectId: string) =>
    getJson<ProjectRecommendation>(`/api/projects/${projectId}/recommendation`),
};

interface SocketHandlers {
  onRefresh: () => void;
  onAlert?: (message: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const RECONNECT_MIN_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export function connectRefreshSocket(handlers: SocketHandlers | (() => void)): () => void {
  const { onRefresh, onAlert, onConnectionChange } =
    typeof handlers === "function" ? { onRefresh: handlers } : handlers;
  const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws";

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = RECONNECT_MIN_DELAY_MS;
  let closedByCaller = false;

  const connect = () => {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectDelay = RECONNECT_MIN_DELAY_MS;
      onConnectionChange?.(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "refresh") onRefresh();
        if (data.type === "alert") onAlert?.(data.message);
      } catch {
        // ignore malformed messages
      }
    };

    socket.onclose = () => {
      onConnectionChange?.(false);
      if (closedByCaller) return;
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS);
    };

    // onclose always fires after onerror for a socket that failed to connect,
    // so reconnection is scheduled there — no separate handling needed here.
    socket.onerror = () => {};
  };

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}
