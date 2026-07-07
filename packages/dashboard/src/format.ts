const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const plainNumber = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompact(n: number): string {
  return compactNumber.format(n);
}

export function formatCount(n: number): string {
  return plainNumber.format(n);
}

export function formatCurrency(n: number): string {
  return n >= 1000 ? compactCurrency.format(n) : currency.format(n);
}
