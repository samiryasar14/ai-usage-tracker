import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Database, MessageSquare, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { api } from "../api";
import type { ProjectAnalyticsRow, SessionHistoryRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";
import { StatCard } from "./StatCard";
import { SessionHistory } from "./SessionHistory";

interface ProjectDetailProps {
  project: ProjectAnalyticsRow;
  /** Session history rows already filtered to this project's path. */
  sessions: SessionHistoryRow[];
  onClose: () => void;
}

export function ProjectDetail({ project, sessions, onClose }: ProjectDetailProps) {
  const recommendation = useQuery({
    queryKey: ["projectRecommendation", project.projectId],
    queryFn: () => api.projectRecommendation(project.projectId),
    enabled: !!project.projectId,
  });

  return (
    <div className="mt-6 rounded-lg border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{project.name}</h2>
          <p className="mt-0.5 text-sm text-text-secondary" title={project.path}>
            {project.path}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project detail"
          className="rounded-md p-1 text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sessions" value={formatCount(project.sessions)} icon={MessageSquare} />
        <StatCard label="Requests" value={formatCount(project.requests)} icon={Zap} />
        <StatCard label="Tokens" value={formatCompact(project.tokens)} icon={Database} />
        <StatCard label="Cost" value={formatCurrency(project.cost)} icon={CircleDollarSign} />
      </div>

      <div className="mt-6 rounded-lg border border-hairline p-4">
        <h3 className="text-sm font-medium text-text-secondary">Recommended limit</h3>
        {recommendation.isLoading ? (
          <p className="mt-2 text-sm text-text-secondary">Calculating…</p>
        ) : recommendation.data ? (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-text-primary">{recommendation.data.reasoning}</p>
              <p className="mt-1 text-xs text-text-secondary">
                Trailing average: {formatCurrency(recommendation.data.trailingAverageUsd)}/mo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 text-sm ${
                  recommendation.data.trendPercent > 0
                    ? "text-red-500"
                    : recommendation.data.trendPercent < 0
                      ? "text-emerald-500"
                      : "text-text-secondary"
                }`}
              >
                {recommendation.data.trendPercent > 0 ? (
                  <TrendingUp size={16} />
                ) : recommendation.data.trendPercent < 0 ? (
                  <TrendingDown size={16} />
                ) : null}
                {recommendation.data.trendPercent > 0 ? "+" : ""}
                {recommendation.data.trendPercent.toFixed(1)}%
              </div>
              <div className="text-2xl font-semibold text-text-primary">
                {formatCurrency(recommendation.data.recommendedMonthlyUsd)}
                <span className="text-sm font-normal text-text-secondary">/mo</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No recommendation available yet.</p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-text-secondary">Session history</h3>
        <div className="mt-3 max-h-96 overflow-y-auto">
          <SessionHistory rows={sessions} />
        </div>
      </div>
    </div>
  );
}
