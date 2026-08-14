"use client";

import { useState } from "react";
import { PieChart as PieIcon } from "lucide-react";
import { CategoryDonut } from "./CategoryDonut";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/format";
import type { CategorySlice } from "@/types";
import { cn } from "@/lib/cn";

type ChartType = "expense" | "income";

interface CategoryChartCardProps {
  expenses: CategorySlice[];
  incomes: CategorySlice[];
  currencyCode: string;
}

export function CategoryChartCard({
  expenses,
  incomes,
  currencyCode,
}: CategoryChartCardProps) {
  const [chartType, setChartType] = useState<ChartType>("expense");

  const data = chartType === "expense" ? expenses : incomes;
  const isExpense = chartType === "expense";

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-card-foreground">
          Movimientos por categoría
        </h3>
        <div className="flex gap-1 self-start rounded-lg bg-muted p-1">
          <button
            onClick={() => setChartType("expense")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isExpense
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Gastos
          </button>
          <button
            onClick={() => setChartType("income")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              !isExpense
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ingresos
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title={isExpense ? "Sin gastos este mes" : "Sin ingresos este mes"}
          description={
            isExpense
              ? "Registra gastos para ver el desglose por categoría."
              : "Registra ingresos para ver el desglose por categoría."
          }
        />
      ) : (
        <>
          <CategoryDonut data={data} currencyCode={currencyCode} />
          <ul className="mt-4 flex flex-col gap-2">
            {data.slice(0, 5).map((item) => (
              <li
                key={item.categoryId}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-card-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium text-muted-foreground">
                  {formatMoney(item.total, currencyCode)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
