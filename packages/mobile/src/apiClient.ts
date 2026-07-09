import { getPairedConnection, clearPairedConnection, type PairedConnection } from "./storage";
import { notifyUnauthorized } from "./authEvents";

// Mirrors packages/dashboard/src/api.ts's shapes — duplicated here rather
// than imported since this package intentionally manages its own
// dependencies outside the pnpm workspace (see pnpm-workspace.yaml).

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

export interface ProjectRecommendation {
  recommendedMonthlyUsd: number;
  reasoning: string;
  trailingAverageUsd: number;
  trendPercent: number;
}

export interface ChatMessageDto {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface MonthlyCostForecast {
  costSoFar: number;
  dailyAverage: number;
  projectedMonthlyCost: number;
  elapsedDays: number;
  totalDays: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

/** Thrown when a request gets a 401 — the caller's screen should route back to pairing. */
export class UnauthorizedError extends Error {
  constructor() {
    super("This device's pairing has been revoked or expired.");
    this.name = "UnauthorizedError";
  }
}

/** Thrown when no device is paired yet — distinct from a network/server error. */
export class NotPairedError extends Error {
  constructor() {
    super("No desktop is paired yet.");
    this.name = "NotPairedError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const connection = await getPairedConnection();
  if (!connection) throw new NotPairedError();

  const res = await fetch(`http://${connection.host}:${connection.port}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${connection.token}`,
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    await clearPairedConnection();
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Claims a pairing code against a specific host/port — used only by the pairing screen, before a token exists. */
export async function claimPairing(
  host: string,
  port: number,
  code: string,
  deviceName: string,
): Promise<PairedConnection> {
  const res = await fetch(`http://${host}:${port}/api/pairing/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, deviceName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Pairing failed: ${res.status}`);
  }
  const { token } = (await res.json()) as { token: string };
  return { host, port, token, deviceName };
}

export const api = {
  overview: () => request<Overview>("/api/overview"),
  timeline: (days = 30) => request<TimelineDay[]>(`/api/timeline?days=${days}`),
  models: () => request<ModelLeaderboardRow[]>("/api/models"),
  sessions: (limit = 100) => request<SessionHistoryRow[]>(`/api/sessions?limit=${limit}`),
  projects: () => request<ProjectAnalyticsRow[]>("/api/projects"),
  forecast: () => request<MonthlyCostForecast>("/api/forecast"),
  projectRecommendation: (projectId: string) =>
    request<ProjectRecommendation>(`/api/projects/${projectId}/recommendation`),
  activity: (limit = 50) => request<ActivityEvent[]>(`/api/activity?limit=${limit}`),
  assistantMessages: () => request<ChatMessageDto[]>("/api/assistant/messages"),
  sendAssistantMessage: (content: string) =>
    request<ChatMessageDto>("/api/assistant/messages", { method: "POST", body: JSON.stringify({ content }) }),
};
