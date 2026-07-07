import type { ModelLeaderboardRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";

interface ModelLeaderboardProps {
  rows: ModelLeaderboardRow[];
}

export function ModelLeaderboard({ rows }: ModelLeaderboardProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline text-left text-text-secondary">
          <th className="py-2 font-medium">Model</th>
          <th className="py-2 font-medium text-right">Calls</th>
          <th className="py-2 font-medium text-right">Tokens</th>
          <th className="py-2 font-medium text-right">Cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.modelName}
            className="border-b border-hairline transition-colors last:border-0 hover:bg-hairline/10"
          >
            <td className="py-2 text-text-primary">{row.modelName}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCount(row.calls)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCompact(row.tokens)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCurrency(row.cost)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={4} className="py-6 text-center text-sm text-text-muted">
              No usage recorded yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
