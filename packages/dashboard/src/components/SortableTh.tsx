import { ChevronDown, ChevronUp } from "lucide-react";
import type { SortDirection } from "../useSortableRows";

interface SortableThProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K;
  direction: SortDirection;
  onSort: (key: K) => void;
  align?: "left" | "right";
}

export function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: SortableThProps<K>) {
  const active = sortKey === activeKey;
  return (
    <th className={`py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-text-primary ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-text-primary" : ""}`}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronDown size={12} className="opacity-0" />
        )}
      </button>
    </th>
  );
}
