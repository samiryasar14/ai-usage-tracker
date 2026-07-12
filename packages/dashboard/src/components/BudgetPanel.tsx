import { useState, type FormEvent } from "react";
import type { AlertEvent, AlertRule, AlertRuleInput, AlertRuleScope, AlertRuleType } from "../api";
import { formatCurrency } from "../format";

interface ScopeOption {
  id: string;
  label: string;
}

interface BudgetPanelProps {
  rules: AlertRule[];
  events: AlertEvent[];
  projectOptions: ScopeOption[];
  modelOptions: ScopeOption[];
  onCreate: (input: AlertRuleInput) => void;
  creating: boolean;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  togglingId: string | null;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onAcknowledge: (id: string) => void;
  acknowledgingId: string | null;
}

const inputClass =
  "rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";

const TYPE_LABEL: Record<AlertRuleType, string> = {
  monthly_budget: "Monthly",
  daily_budget: "Daily",
};

function scopeLabel(rule: AlertRule, projectOptions: ScopeOption[]): string {
  if (rule.scope === "global") return "Whole account";
  if (rule.scope === "model") return `Model: ${rule.scopeId}`;
  const project = projectOptions.find((p) => p.id === rule.scopeId);
  return `Project: ${project?.label ?? rule.scopeId}`;
}

export function BudgetPanel({
  rules,
  events,
  projectOptions,
  modelOptions,
  onCreate,
  creating,
  onToggleEnabled,
  togglingId,
  onDelete,
  deletingId,
  onAcknowledge,
  acknowledgingId,
}: BudgetPanelProps) {
  const [type, setType] = useState<AlertRuleType>("monthly_budget");
  const [scope, setScope] = useState<AlertRuleScope>("global");
  const [scopeId, setScopeId] = useState("");
  const [threshold, setThreshold] = useState(100);

  const scopeOptions = scope === "project" ? projectOptions : scope === "model" ? modelOptions : [];

  function handleScopeChange(next: AlertRuleScope) {
    setScope(next);
    setScopeId("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (scope !== "global" && !scopeId) return;
    onCreate({ type, scope, scopeId: scope === "global" ? null : scopeId, thresholdUsd: threshold });
  }

  return (
    <div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Period
          <select value={type} onChange={(e) => setType(e.target.value as AlertRuleType)} className={`w-32 ${inputClass}`}>
            <option value="monthly_budget">Monthly</option>
            <option value="daily_budget">Daily</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Scope
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value as AlertRuleScope)}
            className={`w-32 ${inputClass}`}
          >
            <option value="global">Whole account</option>
            <option value="project">Project</option>
            <option value="model">Model</option>
          </select>
        </label>
        {scope !== "global" && (
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            {scope === "project" ? "Project" : "Model"}
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className={`w-44 ${inputClass}`}
              required
            >
              <option value="">Select…</option>
              {scopeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Budget (USD)
          <input
            type="number"
            min={0}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className={`w-28 ${inputClass}`}
          />
        </label>
        <button
          type="submit"
          disabled={creating || (scope !== "global" && !scopeId)}
          className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
        >
          {creating ? "Adding…" : "Add rule"}
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2 text-sm ${
              rule.enabled ? "" : "opacity-60"
            }`}
          >
            <div>
              <span className="font-medium text-text-primary">{formatCurrency(rule.thresholdUsd)}</span>
              <span className="text-text-secondary">
                {" "}
                / {TYPE_LABEL[rule.type].toLowerCase()} — {scopeLabel(rule, projectOptions)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  disabled={togglingId === rule.id}
                  onChange={(e) => onToggleEnabled(rule.id, e.target.checked)}
                  className="accent-series-1 transition-colors focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                />
                Enabled
              </label>
              <button
                type="button"
                onClick={() => onDelete(rule.id)}
                disabled={deletingId === rule.id}
                className="rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                {deletingId === rule.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </li>
        ))}
        {rules.length === 0 && (
          <li className="rounded-md border border-dashed border-hairline px-3 py-4 text-center text-sm text-text-muted">
            No budget rules yet — add one above.
          </li>
        )}
      </ul>

      <ul className="mt-4 space-y-2">
        {events.map((event) => (
          <li
            key={event.id}
            className={`flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2 text-sm text-text-primary ${
              event.acknowledgedAt ? "opacity-60" : ""
            }`}
          >
            <span>
              <span className="text-text-secondary">{new Date(event.triggeredAt).toLocaleString()} — </span>
              {event.message}
            </span>
            {event.acknowledgedAt ? (
              <span className="shrink-0 text-xs text-text-muted">Acknowledged</span>
            ) : (
              <button
                type="button"
                onClick={() => onAcknowledge(event.id)}
                disabled={acknowledgingId === event.id}
                className="shrink-0 rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                {acknowledgingId === event.id ? "Acknowledging…" : "Acknowledge"}
              </button>
            )}
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-md border border-dashed border-hairline px-3 py-4 text-center text-sm text-text-muted">
            No budget alerts triggered yet.
          </li>
        )}
      </ul>
    </div>
  );
}
