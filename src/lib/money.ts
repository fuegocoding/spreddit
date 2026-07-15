export function formatUsd(cents: number, opts: { withCents?: boolean } = {}): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.withCents ? 2 : 0,
    maximumFractionDigits: opts.withCents ? 2 : 0,
  }).format(dollars);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
