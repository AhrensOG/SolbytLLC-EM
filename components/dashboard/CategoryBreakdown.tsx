"use client";

import { useStats } from "@/lib/hooks/useStats";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { Card } from "@/components/ui/Card";
import { CategoryChartCard } from "./CategoryChartCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function CategoryBreakdown({ month }: { month?: string }) {
  const currency = useDefaultCurrency();
  const { data: stats, isLoading } = useStats(month, currency?.code);
  const code = stats?.currency.code ?? currency?.code ?? "USD";

  if (isLoading && !stats) {
    return (
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-52 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <CategoryChartCard
        expenses={stats?.byCategory ?? []}
        incomes={stats?.incomeByCategory ?? []}
        currencyCode={code}
      />
    </Card>
  );
}
