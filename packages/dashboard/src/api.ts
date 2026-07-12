const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:4317";

export interface UnpricedModel {
  name: string;
  requestCount: number;
}

export interface Overview {
  todayRequests: number;
  todayCost: number;
  todayTokens: number;
  monthlyTokens: number;
  estimatedMonthlyCost: number;
  subscriptionCostSoFar: number;
  totalSpendSoFar: number;
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
  tags: Tag[];
}

export type AlertRuleType = "monthly_budget" | "daily_budget";
export type AlertRuleScope = "global" | "project" | "model";

export interface AlertRule {
  id: string;
  type: AlertRuleType;
  scope: AlertRuleScope;
  scopeId: string | null;
  thresholdUsd: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRuleInput {
  type: AlertRuleType;
  scope: AlertRuleScope;
  scopeId?: string | null;
  thresholdUsd: number;
  enabled?: boolean;
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
  subscriptionCost: number;
  totalProjectedCost: number;
  elapsedDays: number;
  totalDays: number;
  trendPercent: number;
  weekdayAverage: number;
  weekendAverage: number;
}

export interface InsightsSummary {
  bullets: string[];
}

export interface CostAnomaly {
  date: string;
  cost: number;
  baselineMean: number;
  zScore: number;
}

export type ReportPeriod = "day" | "week" | "month";
export type ReportFormat = "csv" | "json" | "pdf";

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

export interface PairingSession {
  code: string;
  expiresAt: number;
  host: string | null;
  port: number;
}

export interface PairedDevice {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
}

export interface SavedView {
  id: string;
  name: string;
  viewType: string;
  filterConfig: string;
  createdAt: string;
}

export type SettingKey = "dataRetentionDays" | "notifyOnBudgetAlert" | "defaultReportPeriod" | "defaultReportFormat";
export type Settings = Partial<Record<SettingKey, string>>;

export interface ProviderStatus {
  name: string;
  displayName: string;
  requiresCredentials: boolean;
  enabled: boolean;
  connected: boolean;
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

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
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

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
  imageUrl: string | null;
}

export function reportExportUrl(period: ReportPeriod, format: ReportFormat): string {
  return `${API_BASE}/api/reports/export?period=${period}&format=${format}`;
}

export function syncExportUrl(): string {
  return `${API_BASE}/api/sync/export`;
}

export interface SyncImportResult {
  imported: number;
  total: number;
}

export const api = {
  overview: () => getJson<Overview>("/api/overview"),
  timeline: (days = 30) => getJson<TimelineDay[]>(`/api/timeline?days=${days}`),
  models: () => getJson<ModelLeaderboardRow[]>("/api/models"),
  sessions: (limit = 100) => getJson<SessionHistoryRow[]>(`/api/sessions?limit=${limit}`),
  projects: () => getJson<ProjectAnalyticsRow[]>("/api/projects"),
  alertRules: () => getJson<AlertRule[]>("/api/alerts/rules"),
  createAlertRule: (input: AlertRuleInput) => postJson<AlertRule>("/api/alerts/rules", input),
  updateAlertRule: (id: string, input: Partial<AlertRuleInput>) =>
    putJson<AlertRule>(`/api/alerts/rules/${id}`, input),
  deleteAlertRule: (id: string) => del(`/api/alerts/rules/${id}`),
  alertEvents: (limit = 20) => getJson<AlertEvent[]>(`/api/alerts/events?limit=${limit}`),
  acknowledgeAlertEvent: (id: string) => patchJson<AlertEvent>(`/api/alerts/events/${id}/acknowledge`, {}),
  forecast: () => getJson<MonthlyCostForecast>("/api/forecast"),
  anomalies: () => getJson<CostAnomaly[]>("/api/anomalies"),
  insights: () => getJson<InsightsSummary>("/api/insights"),
  importSyncBundle: (records: unknown[]) => postJson<SyncImportResult>("/api/sync/import", records),
  subscriptions: () => getJson<Subscription[]>("/api/subscriptions"),
  createSubscription: (input: SubscriptionInput) => postJson<Subscription>("/api/subscriptions", input),
  updateSubscription: (id: string, input: Partial<SubscriptionInput>) =>
    putJson<Subscription>(`/api/subscriptions/${id}`, input),
  deleteSubscription: (id: string) => del(`/api/subscriptions/${id}`),
  assistantMessages: () => getJson<ChatMessageDto[]>("/api/assistant/messages"),
  sendAssistantMessage: (content: string) =>
    postJson<ChatMessageDto>("/api/assistant/messages", { content }),
  projectRecommendation: (projectId: string) =>
    getJson<ProjectRecommendation>(`/api/projects/${projectId}/recommendation`),
  startPairing: () => postJson<PairingSession>("/api/pairing/start", {}),
  pairedDevices: () => getJson<PairedDevice[]>("/api/pairing/devices"),
  revokeDevice: (id: string) => del(`/api/pairing/devices/${id}`),
  activity: (limit = 50) => getJson<ActivityEvent[]>(`/api/activity?limit=${limit}`),
  tags: () => getJson<Tag[]>("/api/tags"),
  createTag: (name: string, color: string) => postJson<Tag>("/api/tags", { name, color }),
  deleteTag: (id: string) => del(`/api/tags/${id}`),
  addTagToProject: (projectId: string, tagId: string) =>
    postJson<void>(`/api/projects/${projectId}/tags/${tagId}`, {}),
  removeTagFromProject: (projectId: string, tagId: string) => del(`/api/projects/${projectId}/tags/${tagId}`),
  projectNotes: (projectId: string) => getJson<ProjectNote[]>(`/api/projects/${projectId}/notes`),
  addProjectNote: (projectId: string, content: string) =>
    postJson<ProjectNote>(`/api/projects/${projectId}/notes`, { content }),
  deleteNote: (id: string) => del(`/api/notes/${id}`),
  savedViews: (viewType: string) => getJson<SavedView[]>(`/api/saved-views?viewType=${viewType}`),
  createSavedView: (name: string, viewType: string, filterConfig: string) =>
    postJson<SavedView>("/api/saved-views", { name, viewType, filterConfig }),
  deleteSavedView: (id: string) => del(`/api/saved-views/${id}`),
  news: (limit = 20, force = false) =>
    getJson<NewsItem[]>(`/api/news?limit=${limit}${force ? "&force=1" : ""}`),
  settings: () => getJson<Settings>("/api/settings"),
  setSetting: (key: SettingKey, value: string) => putJson<Settings>(`/api/settings/${key}`, { value }),
  providers: () => getJson<ProviderStatus[]>("/api/providers"),
  setProviderEnabled: (name: string, enabled: boolean) =>
    putJson<ProviderStatus[]>(`/api/providers/${name}/enabled`, { enabled }),
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
