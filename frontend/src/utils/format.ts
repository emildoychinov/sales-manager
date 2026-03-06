export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  if (value <= 0) return "—";
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, ...options })}`;
}
