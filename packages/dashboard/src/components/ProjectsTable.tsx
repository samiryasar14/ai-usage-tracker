import type { ProjectAnalyticsRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";

interface ProjectsTableProps {
  rows: ProjectAnalyticsRow[];
  onSelect?: (projectId: string) => void;
  selectedProjectId?: string | null;
}

export function ProjectsTable({ rows, onSelect, selectedProjectId }: ProjectsTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline text-left text-text-secondary">
          <th className="py-2 font-medium">Project</th>
          <th className="py-2 font-medium text-right">Sessions</th>
          <th className="py-2 font-medium text-right">Requests</th>
          <th className="py-2 font-medium text-right">Tokens</th>
          <th className="py-2 font-medium text-right">Cost</th>
          <th className="py-2 font-medium text-right">Last active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.projectId}
            onClick={onSelect ? () => onSelect(row.projectId) : undefined}
            className={`border-b border-hairline last:border-0 ${onSelect ? "cursor-pointer hover:bg-text-primary/[0.03]" : ""} ${
              selectedProjectId === row.projectId ? "bg-text-primary/[0.05]" : ""
            }`}
          >
            <td className="py-2 text-text-primary" title={row.path}>
              {row.name}
            </td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCount(row.sessions)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCount(row.requests)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCompact(row.tokens)}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{formatCurrency(row.cost)}</td>
            <td className="py-2 text-right tabular-nums text-text-secondary">
              {row.lastActiveAt ? new Date(row.lastActiveAt).toLocaleDateString() : "—"}
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="py-4 text-center text-text-muted">
              No projects recorded yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
