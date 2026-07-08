import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CircleDollarSign,
  CreditCard,
  Database,
  FileDown,
  History,
  Layers,
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
import { formatCompact, formatCount, formatCurrency } from "../format";

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

  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 15_000 });
  const timeline = useQuery({ queryKey: ["timeline"], queryFn: () => api.timeline(30), refetchInterval: 15_000 });
  const models = useQuery({ queryKey: ["models"], queryFn: api.models, refetchInterval: 15_000 });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => api.sessions(50), refetchInterval: 15_000 });
  const alertRules = useQuery({ queryKey: ["alertRules"], queryFn: api.alertRules });
  const alertEvents = useQuery({ queryKey: ["alertEvents"], queryFn: () => api.alertEvents(10) });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast, refetchInterval: 15_000 });
  const subscriptions = useQuery({ queryKey: ["subscriptions"], queryFn: api.subscriptions });

  const saveBudget = useMutation({
    mutationFn: ({ thresholdUsd, enabled }: { thresholdUsd: number; enabled: boolean }) =>
      api.setMonthlyBudget(thresholdUsd, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertRules"] }),
  });

  const addSubscription = useMutation({
    mutationFn: api.createSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const removeSubscription = useMutation({
    mutationFn: api.deleteSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const monthlyBudgetRule = alertRules.data?.find((r) => r.type === "monthly_budget");

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
          label="Estimated monthly cost"
          value={
            overview.isLoading ? "…" : overview.data ? formatCurrency(overview.data.estimatedMonthlyCost) : "—"
          }
          icon={CircleDollarSign}
        />
        <StatCard
          label="Projected month-end cost"
          value={forecast.isLoading ? "…" : forecast.data ? formatCurrency(forecast.data.projectedMonthlyCost) : "—"}
          icon={TrendingUp}
        />
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={TrendingUp}>Usage timeline (30 days)</SectionHeading>
        <div className="mt-3">
          <Timeline data={timeline.data ?? []} />
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={Trophy}>Model leaderboard</SectionHeading>
          <div className="mt-3">
            <ModelLeaderboard rows={models.data ?? []} />
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={History}>Recent sessions</SectionHeading>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <SessionHistory rows={sessions.data ?? []} />
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={Bell}>Budget alerts</SectionHeading>
        <div className="mt-3">
          <BudgetPanel
            rule={monthlyBudgetRule}
            events={alertEvents.data ?? []}
            saving={saveBudget.isPending}
            onSave={(thresholdUsd, enabled) => saveBudget.mutate({ thresholdUsd, enabled })}
          />
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={CreditCard}>Subscriptions</SectionHeading>
        <div className="mt-3">
          <SubscriptionsPanel
            subscriptions={subscriptions.data ?? []}
            adding={addSubscription.isPending}
            onAdd={(input) => addSubscription.mutate(input)}
            onDelete={(id) => removeSubscription.mutate(id)}
          />
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
