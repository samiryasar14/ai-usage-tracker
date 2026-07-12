import { useMemo, useState } from "react";
import type { SessionHistoryRow } from "../api";
import { formatCompact, formatCurrency } from "../format";
import { useSortableRows } from "../useSortableRows";
import { SortableTh } from "./SortableTh";

interface SessionHistoryProps {
  rows: SessionHistoryRow[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

type SortKey = "timestamp" | "project" | "model" | "tokens" | "cost";

const getValue = (row: SessionHistoryRow, key: SortKey) =>
  key === "timestamp" ? new Date(row.timestamp).getTime() : row[key];

export function SessionHistory({ rows, onLoadMore, hasMore, loadingMore }: SessionHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) => r.project.toLowerCase().includes(term) || r.model.toLowerCase().includes(term),
    );
  }, [rows, search]);

  const { sorted, sortKey, direction, toggleSort } = useSortableRows<SessionHistoryRow, SortKey>(
    filtered,
    getValue,
    "timestamp",
  );

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by project or model…"
        className="mb-3 w-full rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-text-secondary">
            <SortableTh label="Time" sortKey="timestamp" activeKey={sortKey} direction={direction} onSort={toggleSort} />
            <SortableTh label="Project" sortKey="project" activeKey={sortKey} direction={direction} onSort={toggleSort} />
            <SortableTh label="Model" sortKey="model" activeKey={sortKey} direction={direction} onSort={toggleSort} />
            <SortableTh
              label="Tokens"
              sortKey="tokens"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
              align="right"
            />
            <SortableTh
              label="Cost"
              sortKey="cost"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
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
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-text-muted">
                {rows.length === 0 ? "No sessions recorded yet." : "No sessions match your filter."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {onLoadMore && hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mt-3 w-full rounded-md border border-hairline py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-hairline/10 hover:text-text-primary disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
