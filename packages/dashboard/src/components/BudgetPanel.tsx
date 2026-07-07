import { useEffect, useState } from "react";
import type { AlertEvent, AlertRule } from "../api";
import { formatCurrency } from "../format";

interface BudgetPanelProps {
  rule: AlertRule | undefined;
  events: AlertEvent[];
  onSave: (thresholdUsd: number, enabled: boolean) => void;
  saving: boolean;
}

export function BudgetPanel({ rule, events, onSave, saving }: BudgetPanelProps) {
  const [threshold, setThreshold] = useState(rule?.thresholdUsd ?? 100);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);

  // Sync local form state once the rule loads from the server (it arrives
  // asynchronously after mount, so the useState initializer alone would miss it).
  useEffect(() => {
    if (rule) {
      setThreshold(rule.thresholdUsd);
      setEnabled(rule.enabled);
    }
  }, [rule]);

  return (
    <div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(threshold, enabled);
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Monthly budget (USD)
          <input
            type="number"
            min={0}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-32 rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary"
          />
        </label>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-text-secondary">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {rule && (
          <span className="pb-1.5 text-sm text-text-muted">
            Currently alerting at {formatCurrency(rule.thresholdUsd)}/mo{rule.enabled ? "" : " (disabled)"}
          </span>
        )}
      </form>

      <ul className="mt-4 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-hairline px-3 py-2 text-sm text-text-primary">
            <span className="text-text-secondary">{new Date(event.triggeredAt).toLocaleString()} — </span>
            {event.message}
          </li>
        ))}
        {events.length === 0 && <li className="text-sm text-text-muted">No budget alerts triggered yet.</li>}
      </ul>
    </div>
  );
}
