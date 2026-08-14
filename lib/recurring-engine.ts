export type Frequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface DuePeriod {
  period: string;
  date: string;
}

const MAX_OCCURRENCES = 120;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function occurrenceAtMonths(start: Date, months: number): Date {
  const anchorDay = start.getDate();
  const target = new Date(start.getFullYear(), start.getMonth() + months, 1);
  const clampedDay = Math.min(
    anchorDay,
    daysInMonth(target.getFullYear(), target.getMonth()),
  );
  target.setDate(clampedDay);
  return target;
}

export function computeOccurrences(
  frequency: Frequency,
  startDate: string,
  maxOccurrences: number = MAX_OCCURRENCES,
): Date[] {
  const start = new Date(`${startDate}T00:00:00`);
  const dates: Date[] = [];

  const stepMonths: Record<Frequency, number> = {
    weekly: 0,
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };

  for (let i = 0; i < maxOccurrences; i++) {
    if (frequency === "weekly") {
      const d = new Date(start);
      d.setDate(d.getDate() + i * 7);
      dates.push(d);
    } else {
      dates.push(occurrenceAtMonths(start, i * stepMonths[frequency]));
    }
  }
  return dates;
}

export function computeDuePeriods(opts: {
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  today?: string;
}): DuePeriod[] {
  const today = new Date(`${opts.today ?? toISO(new Date())}T00:00:00`);
  const end = opts.endDate ? new Date(`${opts.endDate}T00:00:00`) : null;

  const dates = computeOccurrences(opts.frequency, opts.startDate);

  return dates
    .filter((d) => d <= today)
    .filter((d) => (end ? d <= end : true))
    .map((d) => ({
      period: toISO(d),
      date: toISO(d),
    }));
}

export function computeNextDate(opts: {
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  today?: string;
}): string | null {
  const today = new Date(`${opts.today ?? toISO(new Date())}T00:00:00`);
  const end = opts.endDate ? new Date(`${opts.endDate}T00:00:00`) : null;

  const dates = computeOccurrences(opts.frequency, opts.startDate);
  const next = dates.find((d) => d > today);
  if (!next) return null;
  if (end && next > end) return null;
  return toISO(next);
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};
