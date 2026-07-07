import type { SessionHistoryRow } from "../api";
import { formatCompact, formatCurrency } from "../format";

interface SessionHistoryProps {
  rows: SessionHistoryRow[];
}

export function SessionHistory({ rows }: SessionHistoryProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline text-left text-text-secondary">
          <th className="py-2 font-medium">Time</th>
          <th className="py-2 font-medium">Project</th>
          <th className="py-2 font-medium">Model</th>
          <th className="py-2 font-medium text-right">Tokens</th>
          <th className="py-2 font-medium text-right">Cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-hairline last:border-0">
            <td className="py-2 tabular-nums text-text-secondary">
              {new Date(row.timestamp).toLocaleString()}
            </td>
            <td className="py-2 text-text-primary" title={row.projectPath}>
              {row.project}
            </td>
            <td className="py-2 text-text-primary">{row.model}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCompact(row.tokens)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCurrency(row.cost)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="py-4 text-center text-text-muted">
              No sessions recorded yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
