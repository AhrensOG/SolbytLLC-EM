export interface MonthWindow {
  month: string;
  start: string;
  end: string;
}

export function buildMonthWindows(
  endMonth: string | null,
  count: number,
): MonthWindow[] {
  const now = new Date();
  const [year, mon] =
    endMonth && /^\d{4}-\d{2}$/.test(endMonth)
      ? endMonth.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

  const windows: MonthWindow[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, mon - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const next = new Date(y, m, 1);
    windows.push({
      month: `${y}-${String(m).padStart(2, "0")}`,
      start: `${y}-${String(m).padStart(2, "0")}-01`,
      end: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
    });
  }
  return windows;
}

export function buildMonthlySeries(
  windows: MonthWindow[],
  transactions: { date: string; type: string; convertedAmount: number | null }[],
  displayRate: number,
): { month: string; income: number; expense: number }[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const w of windows) map.set(w.month, { income: 0, expense: 0 });

  for (const tx of transactions) {
    const month = String(tx.date).slice(0, 7);
    const entry = map.get(month);
    if (!entry) continue;
    const value = Number(tx.convertedAmount ?? 0);
    if (tx.type === "income") entry.income += value;
    else entry.expense += value;
  }

  const round = (v: number) => Math.round((v / displayRate) * 100) / 100;

  return windows.map((w) => {
    const e = map.get(w.month)!;
    return { month: w.month, income: round(e.income), expense: round(e.expense) };
  });
}
