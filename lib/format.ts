export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(
    "es",
    options ?? { day: "numeric", month: "short", year: "numeric" },
  );
}

export function formatMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, (mon ?? 1) - 1, 1);
  return date.toLocaleDateString("es", { month: "long", year: "numeric" });
}

export function formatMonthShort(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, (mon ?? 1) - 1, 1);
  return date.toLocaleDateString("es", { month: "short" }).replace(".", "");
}

export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, (mon ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMoney(
  amount: number,
  currencyCode = "USD",
  options?: { compact?: boolean },
) {
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currencyCode,
    ...(options?.compact
      ? { notation: "compact", maximumFractionDigits: 1 }
      : {}),
  };
  try {
    return new Intl.NumberFormat("es", opts).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
