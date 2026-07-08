// Shared formatting helpers for the mobile app's Dashboard/Projects screens.
// Mirrors the spirit of packages/dashboard/src/format.ts but keeps to the
// exact formatting rules called out for the mobile UI (plain toFixed(2)
// currency, compact notation for large token counts).

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const countFormatter = new Intl.NumberFormat("en-US");

export function formatCompactNumber(n: number): string {
  return compactNumberFormatter.format(n);
}

export function formatCount(n: number): string {
  return countFormatter.format(n);
}

export function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Formats a `YYYY-MM-DD` timeline day string as e.g. "Jul 8". */
export function formatShortDate(isoDay: string): string {
  const date = new Date(`${isoDay}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDay;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Formats a project's `lastActiveAt` ISO timestamp, or a fallback when never active. */
export function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Clamps to [0, 100] and returns a `DimensionValue`-friendly width percentage string. */
export function widthPercent(n: number): `${number}%` {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
  return `${clamped}%`;
}
