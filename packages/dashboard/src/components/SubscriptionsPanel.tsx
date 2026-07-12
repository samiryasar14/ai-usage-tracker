import { useState } from "react";
import type { Subscription, SubscriptionInput } from "../api";
import { formatCurrency } from "../format";

interface SubscriptionsPanelProps {
  subscriptions: Subscription[];
  onAdd: (input: SubscriptionInput) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, input: Partial<SubscriptionInput>) => void;
  adding: boolean;
  updatingId: string | null;
}

const cellInputClass =
  "w-full rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";

interface EditDraft {
  name: string;
  monthlyCostUsd: number;
  renewalDay: number;
  status: string;
}

export function SubscriptionsPanel({
  subscriptions,
  onAdd,
  onDelete,
  onUpdate,
  adding,
  updatingId,
}: SubscriptionsPanelProps) {
  const [name, setName] = useState("");
  const [monthlyCostUsd, setMonthlyCostUsd] = useState(20);
  const [renewalDay, setRenewalDay] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  function startEdit(sub: Subscription) {
    setEditingId(sub.id);
    setDraft({
      name: sub.name,
      monthlyCostUsd: sub.monthlyCostUsd,
      renewalDay: sub.renewalDay,
      status: sub.status,
    });
  }

  function saveEdit(id: string) {
    if (!draft || !draft.name.trim()) return;
    onUpdate(id, {
      name: draft.name.trim(),
      monthlyCostUsd: draft.monthlyCostUsd,
      renewalDay: draft.renewalDay,
      status: draft.status,
    });
    setEditingId(null);
    setDraft(null);
  }

  const activeTotal = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.monthlyCostUsd, 0);

  return (
    <div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({ name: name.trim(), monthlyCostUsd, renewalDay });
          setName("");
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cursor Pro"
            className="w-40 rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Monthly cost (USD)
          <input
            type="number"
            min={0}
            step={1}
            value={monthlyCostUsd}
            onChange={(e) => setMonthlyCostUsd(Number(e.target.value))}
            className="w-28 rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Renewal day
          <input
            type="number"
            min={1}
            max={31}
            value={renewalDay}
            onChange={(e) => setRenewalDay(Number(e.target.value))}
            className="w-24 rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
          />
        </label>
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-text-secondary">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium text-right">Monthly cost</th>
            <th className="py-2 font-medium text-right">Renews</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => {
            const isEditing = editingId === sub.id && draft;
            if (isEditing && draft) {
              return (
                <tr key={sub.id} className="border-b border-hairline last:border-0">
                  <td className="py-2">
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className={cellInputClass}
                      autoFocus
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={draft.monthlyCostUsd}
                      onChange={(e) => setDraft({ ...draft, monthlyCostUsd: Number(e.target.value) })}
                      className={`${cellInputClass} text-right`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={draft.renewalDay}
                      onChange={(e) => setDraft({ ...draft, renewalDay: Number(e.target.value) })}
                      className={`${cellInputClass} text-right`}
                    />
                  </td>
                  <td className="py-2">
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      className={cellInputClass}
                    >
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(sub.id)}
                        disabled={updatingId === sub.id || !draft.name.trim()}
                        className="rounded-sm text-xs font-medium text-series-1 transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                      >
                        {updatingId === sub.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setDraft(null);
                        }}
                        className="rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={sub.id}
                className="border-b border-hairline transition-colors last:border-0 hover:bg-hairline/10"
              >
                <td className="py-2 text-text-primary">{sub.name}</td>
                <td className="py-2 text-right tabular-nums text-text-primary">
                  {formatCurrency(sub.monthlyCostUsd)}
                </td>
                <td className="py-2 text-right tabular-nums text-text-secondary">Day {sub.renewalDay}</td>
                <td className="py-2 text-text-secondary capitalize">{sub.status}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(sub)}
                      className="rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(sub.id)}
                      className="rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-sm text-text-muted">
                No subscriptions tracked yet.
              </td>
            </tr>
          )}
        </tbody>
        {subscriptions.length > 0 && (
          <tfoot>
            <tr>
              <td className="pt-2 text-sm font-medium text-text-secondary">Total (active)</td>
              <td className="pt-2 text-right text-sm font-medium tabular-nums text-text-primary">
                {formatCurrency(activeTotal)}/mo
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
