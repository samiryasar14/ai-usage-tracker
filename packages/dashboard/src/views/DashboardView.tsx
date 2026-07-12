import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CircleDollarSign,
  CreditCard,
  Database,
  FileDown,
  History,
  Layers,
  Sparkles,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { api } from "../api";
import { StatCard } from "../components/StatCard";
import { Timeline } from "../components/Timeline";
import { ModelLeaderboard } from "../components/ModelLeaderboard";
import { SessionHistory } from "../components/SessionHistory";
import { BudgetPanel } from "../components/BudgetPanel";
import { SubscriptionsPanel } from "../components/SubscriptionsPanel";
import { ReportsPanel } from "../components/ReportsPanel";
import { AnomaliesPanel } from "../components/AnomaliesPanel";
import { InsightsPanel } from "../components/InsightsPanel";
import { QueryState } from "../components/QueryState";
import { Onboarding } from "../components/Onboarding";
import { formatCompact, formatCount, formatCurrency } from "../format";

const SESSIONS_PAGE_SIZE = 50;

interface SectionHeadingProps {
  icon: ComponentType<{ size?: string | number; className?: string }>;
  children: ReactNode;
}

function SectionHeading({ icon: Icon, children }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary">
      <Icon size={16} className="text-text-secondary" />
      {children}
    </h2>
  );
}

export function DashboardView() {
  const queryClient = useQueryClient();
  const [sessionsLimit, setSessionsLimit] = useState(SESSIONS_PAGE_SIZE);

  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 15_000 });
  const timeline = useQuery({ queryKey: ["timeline"], queryFn: () => api.timeline(30), refetchInterval: 15_000 });
  const models = useQuery({ queryKey: ["models"], queryFn: api.models, refetchInterval: 15_000 });
  const sessions = useQuery({
    queryKey: ["sessions", sessionsLimit],
    queryFn: () => api.sessions(sessionsLimit),
    refetchInterval: 15_000,
  });
  const alertRules = useQuery({ queryKey: ["alertRules"], queryFn: api.alertRules });
  const alertEvents = useQuery({ queryKey: ["alertEvents"], queryFn: () => api.alertEvents(10) });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast, refetchInterval: 15_000 });
  const anomalies = useQuery({ queryKey: ["anomalies"], queryFn: api.anomalies, refetchInterval: 60_000 });
  const insights = useQuery({ queryKey: ["insights"], queryFn: api.insights, refetchInterval: 60_000 });
  const subscriptions = useQuery({ queryKey: ["subscriptions"], queryFn: api.subscriptions });
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects });

  const createRule = useMutation({
    mutationFn: api.createAlertRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertRules"] }),
  });

  const toggleRuleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.updateAlertRule(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertRules"] }),
  });

  const removeRule = useMutation({
    mutationFn: api.deleteAlertRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertRules"] }),
  });

  const acknowledgeAlert = useMutation({
    mutationFn: api.acknowledgeAlertEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertEvents"] }),
  });

  const addSubscription = useMutation({
    mutationFn: api.createSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const updateSubscription = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateSubscription>[1] }) =>
      api.updateSubscription(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const removeSubscription = useMutation({
    mutationFn: api.deleteSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const hasAnyData = (overview.data?.modelsUsed ?? 0) > 0 || (sessions.data?.length ?? 0) > 0;
  if (!overview.isLoading && !overview.isError && !hasAnyData) {
    return <Onboarding />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Today's requests"
          value={overview.isLoading ? "…" : overview.data ? formatCount(overview.data.todayRequests) : "—"}
          icon={Zap}
        />
        <StatCard
          label="Today's tokens"
          value={overview.isLoading ? "…" : overview.data ? formatCompact(overview.data.todayTokens) : "—"}
          icon={Database}
        />
        <StatCard
          label="Monthly tokens"
          value={overview.isLoading ? "…" : overview.data ? formatCompact(overview.data.monthlyTokens) : "—"}
          icon={Layers}
        />
        <StatCard
          label="Total spend so far"
          value={overview.isLoading ? "…" : overview.data ? formatCurrency(overview.data.totalSpendSoFar) : "—"}
          icon={CircleDollarSign}
          note={
            overview.data && overview.data.subscriptionCostSoFar > 0
              ? `usage ${formatCurrency(overview.data.estimatedMonthlyCost)} + subscriptions ${formatCurrency(overview.data.subscriptionCostSoFar)}`
              : undefined
          }
        />
        <StatCard
          label="Projected month-end spend"
          value={forecast.isLoading ? "…" : forecast.data ? formatCurrency(forecast.data.totalProjectedCost) : "—"}
          icon={TrendingUp}
          note={
            forecast.data
              ? `${forecast.data.trendPercent >= 0 ? "+" : ""}${forecast.data.trendPercent}% usage vs last month`
              : undefined
          }
          noteTone={forecast.data ? (forecast.data.trendPercent > 0 ? "up" : "down") : "neutral"}
        />
      </div>

      {(insights.data?.bullets.length ?? 0) > 0 && (
        <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={Sparkles}>Insights</SectionHeading>
          <div className="mt-3">
            <InsightsPanel bullets={insights.data?.bullets ?? []} />
          </div>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={TrendingUp}>Usage timeline (30 days)</SectionHeading>
        <div className="mt-3">
          <Timeline data={timeline.data ?? []} />
        </div>
      </section>

      {(anomalies.data?.length ?? 0) > 0 && (
        <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={AlertTriangle}>Spending anomalies</SectionHeading>
          <div className="mt-3">
            <AnomaliesPanel anomalies={anomalies.data ?? []} />
          </div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={Trophy}>Model leaderboard</SectionHeading>
          <div className="mt-3">
            <QueryState
              isLoading={models.isLoading}
              isError={models.isError}
              onRetry={() => models.refetch()}
            >
              <ModelLeaderboard rows={models.data ?? []} />
            </QueryState>
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={History}>Recent sessions</SectionHeading>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <QueryState
              isLoading={sessions.isLoading}
              isError={sessions.isError}
              onRetry={() => sessions.refetch()}
            >
              <SessionHistory
                rows={sessions.data ?? []}
                onLoadMore={() => setSessionsLimit((n) => n + SESSIONS_PAGE_SIZE)}
                hasMore={(sessions.data?.length ?? 0) >= sessionsLimit}
                loadingMore={sessions.isFetching && !sessions.isLoading}
              />
            </QueryState>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={Bell}>Budget alerts</SectionHeading>
        <div className="mt-3">
          <QueryState
            isLoading={alertRules.isLoading || alertEvents.isLoading}
            isError={alertRules.isError || alertEvents.isError}
            onRetry={() => {
              alertRules.refetch();
              alertEvents.refetch();
            }}
          >
            <BudgetPanel
              rules={alertRules.data ?? []}
              events={alertEvents.data ?? []}
              projectOptions={(projects.data ?? []).map((p) => ({ id: p.projectId, label: p.name }))}
              modelOptions={(models.data ?? []).map((m) => ({ id: m.modelName, label: m.modelName }))}
              onCreate={(input) => createRule.mutate(input)}
              creating={createRule.isPending}
              onToggleEnabled={(id, enabled) => toggleRuleEnabled.mutate({ id, enabled })}
              togglingId={toggleRuleEnabled.isPending ? (toggleRuleEnabled.variables?.id ?? null) : null}
              onDelete={(id) => removeRule.mutate(id)}
              deletingId={removeRule.isPending ? (removeRule.variables ?? null) : null}
              onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
              acknowledgingId={acknowledgeAlert.isPending ? (acknowledgeAlert.variables ?? null) : null}
            />
          </QueryState>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={CreditCard}>Subscriptions</SectionHeading>
        <div className="mt-3">
          <QueryState
            isLoading={subscriptions.isLoading}
            isError={subscriptions.isError}
            onRetry={() => subscriptions.refetch()}
          >
            <SubscriptionsPanel
              subscriptions={subscriptions.data ?? []}
              adding={addSubscription.isPending}
              onAdd={(input) => addSubscription.mutate(input)}
              onUpdate={(id, input) => updateSubscription.mutate({ id, input })}
              updatingId={updateSubscription.isPending ? (updateSubscription.variables?.id ?? null) : null}
              onDelete={(id) => removeSubscription.mutate(id)}
            />
          </QueryState>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={FileDown}>Reports</SectionHeading>
        <div className="mt-3">
          <ReportsPanel />
        </div>
      </section>
    </div>
  );
}
