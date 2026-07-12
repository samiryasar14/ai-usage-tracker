import { getDb } from "@ai-usage-tracker/db";
import { getActiveSubscriptionsMonthlyTotal } from "./subscriptions.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export async function getOverview() {
  const db = getDb();
  const now = new Date();
  const todayStart = startOfTodayUtc();
  const monthStart = startOfMonthUtc();

  const [todayAgg, monthAgg, modelsUsed, providersConnected, unpricedModels, subscriptionsMonthlyTotal] =
    await Promise.all([
    db.request.aggregate({
      where: { timestamp: { gte: todayStart }, isSidechain: false },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheCreationTokens: true, cost: true },
    }),
    db.request.aggregate({
      where: { timestamp: { gte: monthStart }, isSidechain: false },
      _count: true,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheReadTokens: true,
        cacheCreationTokens: true,
        cost: true,
      },
    }),
    db.model.count(),
    db.provider.count(),
    db.model.findMany({
      where: { pricingUnknown: true },
      select: { name: true, _count: { select: { requests: { where: { isSidechain: false } } } } },
    }),
    getActiveSubscriptionsMonthlyTotal(),
  ]);

  const sumTokens = (agg: {
    inputTokens: number | null;
    outputTokens: number | null;
    cacheReadTokens: number | null;
    cacheCreationTokens: number | null;
  }) =>
    (agg.inputTokens ?? 0) +
    (agg.outputTokens ?? 0) +
    (agg.cacheReadTokens ?? 0) +
    (agg.cacheCreationTokens ?? 0);

  // Subscriptions bill a flat amount regardless of usage, so "spend so far
  // this month" prorates each one to a daily rate rather than counting the
  // full monthly fee from day one — puts it on the same elapsed-time basis
  // as usage cost, which does accrue daily.
  const elapsedDays = Math.max((now.getTime() - monthStart.getTime()) / MS_PER_DAY, 0.5);
  const totalDaysThisMonth = daysInMonth(now.getUTCFullYear(), now.getUTCMonth());
  const subscriptionCostSoFar = (subscriptionsMonthlyTotal / totalDaysThisMonth) * elapsedDays;
  const estimatedMonthlyCost = monthAgg._sum.cost ?? 0;

  return {
    todayRequests: todayAgg._count,
    todayCost: todayAgg._sum.cost ?? 0,
    todayTokens: sumTokens(todayAgg._sum),
    monthlyTokens: sumTokens(monthAgg._sum),
    estimatedMonthlyCost,
    subscriptionCostSoFar: Math.round(subscriptionCostSoFar * 100) / 100,
    totalSpendSoFar: Math.round((estimatedMonthlyCost + subscriptionCostSoFar) * 100) / 100,
    modelsUsed,
    providersConnected,
    unpricedModels: unpricedModels.map((m) => ({ name: m.name, requestCount: m._count.requests })),
  };
}

export async function getTimeline(days: number) {
  const db = getDb();
  // Prisma stores SQLite DateTime columns as integer milliseconds-since-epoch,
  // so grouping/filtering must go through unixepoch (millis / 1000), not ISO strings.
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;

  // better-sqlite3 returns COUNT/SUM-over-integer-columns as BigInt; cast to
  // Number for JSON serialization (cost is REAL so it comes back as a number already).
  const rows = await db.$queryRaw<Array<{ day: string; requests: bigint; tokens: bigint | null; cost: number | null }>>`
    SELECT
      date(timestamp / 1000, 'unixepoch') as day,
      COUNT(*) as requests,
      SUM(inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens) as tokens,
      SUM(cost) as cost
    FROM Request
    WHERE timestamp >= ${sinceMs} AND isSidechain = 0
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    day: r.day,
    requests: Number(r.requests),
    tokens: Number(r.tokens ?? 0),
    cost: r.cost ?? 0,
  }));
}

export async function getModelLeaderboard() {
  const db = getDb();
  const grouped = await db.request.groupBy({
    by: ["modelId"],
    where: { isSidechain: false },
    _count: true,
    _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheCreationTokens: true, cost: true },
  });

  const models = await db.model.findMany({ where: { id: { in: grouped.map((g) => g.modelId) } } });
  const modelById = new Map(models.map((m) => [m.id, m]));

  return grouped
    .map((g) => {
      const model = modelById.get(g.modelId);
      return {
        modelName: model?.name ?? "unknown",
        calls: g._count,
        tokens:
          (g._sum.inputTokens ?? 0) +
          (g._sum.outputTokens ?? 0) +
          (g._sum.cacheReadTokens ?? 0) +
          (g._sum.cacheCreationTokens ?? 0),
        cost: g._sum.cost ?? 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

export async function getProjectAnalytics() {
  const db = getDb();

  const rows = await db.$queryRaw<
    Array<{
      projectId: string;
      name: string;
      path: string;
      requests: bigint;
      tokens: bigint | null;
      cost: number | null;
      sessions: bigint;
      lastActiveMs: bigint | null;
    }>
  >`
    SELECT
      p.id as projectId,
      p.name as name,
      p.path as path,
      COUNT(r.id) as requests,
      SUM(r.inputTokens + r.outputTokens + r.cacheReadTokens + r.cacheCreationTokens) as tokens,
      SUM(r.cost) as cost,
      COUNT(DISTINCT s.id) as sessions,
      MAX(r.timestamp) as lastActiveMs
    FROM Project p
    JOIN Session s ON s.projectId = p.id
    JOIN Request r ON r.sessionId = s.id
    WHERE r.isSidechain = 0
    GROUP BY p.id
    ORDER BY cost DESC
  `;

  const tags = await db.tag.findMany({
    where: { projects: { some: { id: { in: rows.map((r) => r.projectId) } } } },
    include: { projects: { select: { id: true } } },
  });

  const tagsByProject = new Map<string, typeof tags>();
  for (const tag of tags) {
    for (const project of tag.projects) {
      const existing = tagsByProject.get(project.id) ?? [];
      existing.push(tag);
      tagsByProject.set(project.id, existing);
    }
  }

  return rows.map((r) => ({
    projectId: r.projectId,
    name: r.name,
    path: r.path,
    requests: Number(r.requests),
    tokens: Number(r.tokens ?? 0),
    cost: r.cost ?? 0,
    sessions: Number(r.sessions),
    lastActiveAt: r.lastActiveMs ? new Date(Number(r.lastActiveMs)) : null,
    tags: (tagsByProject.get(r.projectId) ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
  }));
}

export async function getSessionHistory(limit: number, projectPath?: string, modelName?: string) {
  const db = getDb();
  const requests = await db.request.findMany({
    where: {
      isSidechain: false,
      ...(modelName ? { model: { name: modelName } } : {}),
      ...(projectPath ? { session: { project: { path: projectPath } } } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      model: true,
      session: { include: { project: true } },
    },
  });

  return requests.map((r) => ({
    timestamp: r.timestamp,
    project: r.session.project.name,
    projectPath: r.session.project.path,
    sessionId: r.session.externalId,
    model: r.model.name,
    tokens: r.inputTokens + r.outputTokens + r.cacheReadTokens + r.cacheCreationTokens,
    cost: r.cost,
  }));
}
