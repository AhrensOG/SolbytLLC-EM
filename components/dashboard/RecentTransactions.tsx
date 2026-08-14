"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { TransactionItem } from "@/components/transactions/TransactionItem";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useTransactions();
  const currency = useDefaultCurrency();
  const code = currency?.code ?? "USD";

  const recent = (transactions ?? []).slice(0, 5);

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">
          Últimos movimientos
        </h3>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading && !transactions ? (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-1.5 h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Aún no hay movimientos"
          description="Registra tu primer ingreso o gasto para empezar."
          action={
            <Link
              href="/transactions/new"
              className="text-sm font-medium text-primary hover:underline"
            >
              Agregar transacción
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {recent.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} currencyCode={code} />
          ))}
        </div>
      )}
    </Card>
  );
}
