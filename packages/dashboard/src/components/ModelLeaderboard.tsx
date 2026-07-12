import { useMemo, useState } from "react";
import type { ModelLeaderboardRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";
import { useSortableRows } from "../useSortableRows";
import { SortableTh } from "./SortableTh";

interface ModelLeaderboardProps {
  rows: ModelLeaderboardRow[];
}

type SortKey = "modelName" | "calls" | "tokens" | "cost";

const getValue = (row: ModelLeaderboardRow, key: SortKey) => row[key];

export function ModelLeaderboard({ rows }: ModelLeaderboardProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((r) => r.modelName.toLowerCase().includes(term)) : rows;
  }, [rows, search]);

  const { sorted, sortKey, direction, toggleSort } = useSortableRows<ModelLeaderboardRow, SortKey>(
    filtered,
    getValue,
    "cost",
  );

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter models…"
        className="mb-3 w-full rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-text-secondary">
            <SortableTh label="Model" sortKey="modelName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
            <SortableTh
              label="Calls"
              sortKey="calls"
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
          {sorted.map((row) => (
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
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-sm text-text-muted">
                {rows.length === 0 ? "No usage recorded yet." : "No models match your filter."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
