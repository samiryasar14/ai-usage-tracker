import { AlertTriangle } from "lucide-react";
import type { CostAnomaly } from "../api";
import { formatCurrency } from "../format";

interface AnomaliesPanelProps {
  anomalies: CostAnomaly[];
}

export function AnomaliesPanel({ anomalies }: AnomaliesPanelProps) {
  if (anomalies.length === 0) {
    return <p className="text-sm text-text-muted">No unusual spending days in the last 30 days.</p>;
  }

  return (
    <ul className="space-y-2">
      {anomalies.map((a) => (
        <li
          key={a.date}
          className="flex items-start gap-2.5 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-medium text-text-primary">{new Date(a.date).toLocaleDateString()}</span>
            <span className="text-text-secondary">
              {" "}
              cost {formatCurrency(a.cost)} — {a.zScore.toFixed(1)}σ above the {formatCurrency(a.baselineMean)}/day
              30-day average.
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
