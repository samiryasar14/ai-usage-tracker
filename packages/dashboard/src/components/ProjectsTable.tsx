import type { ProjectAnalyticsRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";
import { useSortableRows } from "../useSortableRows";
import { SortableTh } from "./SortableTh";

interface ProjectsTableProps {
  rows: ProjectAnalyticsRow[];
  onSelect?: (projectId: string) => void;
  selectedProjectId?: string | null;
}

type SortKey = "name" | "sessions" | "requests" | "tokens" | "cost" | "lastActiveAt";

const getValue = (row: ProjectAnalyticsRow, key: SortKey) =>
  key === "lastActiveAt" ? (row.lastActiveAt ? new Date(row.lastActiveAt).getTime() : 0) : row[key];

export function ProjectsTable({ rows, onSelect, selectedProjectId }: ProjectsTableProps) {
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<ProjectAnalyticsRow, SortKey>(
    rows,
    getValue,
    "cost",
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline text-text-secondary">
          <SortableTh label="Project" sortKey="name" activeKey={sortKey} direction={direction} onSort={toggleSort} />
          <SortableTh
            label="Sessions"
            sortKey="sessions"
            activeKey={sortKey}
            direction={direction}
            onSort={toggleSort}
            align="right"
          />
          <SortableTh
            label="Requests"
            sortKey="requests"
            activeKey={sortKey}
            direction={direction}
            onSort={toggleSort}
            align="right"
          />
          <SortableTh
            label="Tokens"
            sortKey="tokens"
            activeKey={sortKey}
            direction={direction}
            onSort={toggleSort}
            align="right"
          />
          <SortableTh label="Cost" sortKey="cost" activeKey={sortKey} direction={direction} onSort={toggleSort} align="right" />
          <SortableTh
            label="Last active"
            sortKey="lastActiveAt"
            activeKey={sortKey}
            direction={direction}
            onSort={toggleSort}
            align="right"
          />
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
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
