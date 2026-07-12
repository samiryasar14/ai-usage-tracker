import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export function useSortableRows<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => string | number,
  initialKey: K,
  initialDirection: SortDirection = "desc",
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);

  function toggleSort(key: K) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return direction === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, direction, getValue]);

  return { sorted, sortKey, direction, toggleSort };
}
