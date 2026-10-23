/** Explicit display locale; persisted dates remain ISO values. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
