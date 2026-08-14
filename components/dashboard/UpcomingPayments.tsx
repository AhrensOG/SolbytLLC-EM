"use client";

import Link from "next/link";
import { ArrowRight, Repeat } from "lucide-react";
import { useRecurringExpenses } from "@/lib/hooks/useRecurringExpenses";
import { computeNextDate, FREQUENCY_LABELS } from "@/lib/recurring-engine";
import { formatDate, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RecurringExpense } from "@/types";

interface UpcomingPayment {
  recurring: RecurringExpense;
  nextDate: string;
}

export function UpcomingPayments() {
  const { data: recurring } = useRecurringExpenses();

  const upcoming: UpcomingPayment[] = (recurring ?? [])
    .filter((r) => r.active)
    .map((r) => ({
      recurring: r,
      nextDate: computeNextDate({
        frequency: r.frequency,
        startDate: r.startDate,
        endDate: r.endDate,
      }),
    }))
    .filter((p): p is UpcomingPayment & { nextDate: string } => p.nextDate !== null)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 5);

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">
          Próximos pagos
        </h3>
        <Link
          href="/recurring"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Recurrentes <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Sin pagos recurrentes"
          description="Crea gastos o ingresos que se repiten y se aplicarán automáticamente."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {upcoming.map(({ recurring: r, nextDate }) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {r.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {FREQUENCY_LABELS[r.frequency]} · {formatDate(nextDate)}
                </p>
              </div>
              <span
                className={
                  r.type === "income"
                    ? "shrink-0 text-sm font-semibold text-income"
                    : "shrink-0 text-sm font-semibold text-expense"
                }
              >
                {r.type === "income" ? "+" : "-"}
                {formatMoney(r.amount, r.currency?.code ?? "USD")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
