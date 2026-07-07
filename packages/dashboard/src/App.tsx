import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, connectRefreshSocket } from "./api";
import { StatCard } from "./components/StatCard";
import { Timeline } from "./components/Timeline";
import { ModelLeaderboard } from "./components/ModelLeaderboard";
import { SessionHistory } from "./components/SessionHistory";
import { ProjectsTable } from "./components/ProjectsTable";
import { BudgetPanel } from "./components/BudgetPanel";
import { SubscriptionsPanel } from "./components/SubscriptionsPanel";
import { ReportsPanel } from "./components/ReportsPanel";
import { formatCompact, formatCount, formatCurrency } from "./format";

export function App() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    return connectRefreshSocket({
      onRefresh: () => queryClient.invalidateQueries(),
      onAlert: (message) => {
        setToast(message);
        queryClient.invalidateQueries({ queryKey: ["alertEvents"] });
      },
    });
  }, [queryClient]);

  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 15_000 });
  const timeline = useQuery({ queryKey: ["timeline"], queryFn: () => api.timeline(30), refetchInterval: 15_000 });
  const models = useQuery({ queryKey: ["models"], queryFn: api.models, refetchInterval: 15_000 });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => api.sessions(50), refetchInterval: 15_000 });
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects, refetchInterval: 15_000 });
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
    <div className="mx-auto max-w-6xl px-6 py-8">
      {toast && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-600">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-4 font-medium">
            Dismiss
          </button>
        </div>
      )}

      <h1 className="text-xl font-semibold text-text-primary">AI Usage Hub</h1>
      <p className="mt-1 text-sm text-text-secondary">Claude Code usage on this machine.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Today's requests" value={overview.data ? formatCount(overview.data.todayRequests) : "—"} />
        <StatCard label="Today's tokens" value={overview.data ? formatCompact(overview.data.todayTokens) : "—"} />
        <StatCard label="Monthly tokens" value={overview.data ? formatCompact(overview.data.monthlyTokens) : "—"} />
        <StatCard
          label="Estimated monthly cost"
          value={overview.data ? formatCurrency(overview.data.estimatedMonthlyCost) : "—"}
        />
        <StatCard
          label="Projected month-end cost"
          value={forecast.data ? formatCurrency(forecast.data.projectedMonthlyCost) : "—"}
        />
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="text-sm font-medium text-text-secondary">Usage timeline (30 days)</h2>
        <div className="mt-3">
          <Timeline data={timeline.data ?? []} />
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="text-sm font-medium text-text-secondary">Model leaderboard</h2>
          <div className="mt-3">
            <ModelLeaderboard rows={models.data ?? []} />
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="text-sm font-medium text-text-secondary">Recent sessions</h2>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <SessionHistory rows={sessions.data ?? []} />
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="text-sm font-medium text-text-secondary">Projects</h2>
        <div className="mt-3">
          <ProjectsTable rows={projects.data ?? []} />
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <h2 className="text-sm font-medium text-text-secondary">Budget alerts</h2>
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
        <h2 className="text-sm font-medium text-text-secondary">Subscriptions</h2>
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
        <h2 className="text-sm font-medium text-text-secondary">Reports</h2>
        <div className="mt-3">
          <ReportsPanel />
        </div>
      </section>
    </div>
  );
}
