import { Sparkles } from "lucide-react";

interface InsightsPanelProps {
  bullets: string[];
}

export function InsightsPanel({ bullets }: InsightsPanelProps) {
  return (
    <ul className="space-y-2">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-series-1" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}
