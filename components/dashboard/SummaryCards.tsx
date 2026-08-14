"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useStats } from "@/lib/hooks/useStats";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export function SummaryCards({ month }: { month?: string }) {
  const currency = useDefaultCurrency();
  const { data: stats, isLoading, error } = useStats(month, currency?.code);
  const code = stats?.currency.code ?? currency?.code ?? "USD";

  if (error) {
    return <ErrorState message="No se pudo cargar el resumen." />;
  }

  const cards = [
    {
      label: "Balance total",
      value: stats?.balance ?? 0,
      icon: Wallet,
      accent: "text-solbyt-purple-500",
      bg: "bg-solbyt-purple-500/10",
    },
    {
      label: "Ingresos del mes",
      value: stats?.monthlyIncome ?? 0,
      icon: ArrowUpRight,
      accent: "text-income",
      bg: "bg-solbyt-pink-500/10",
    },
    {
      label: "Gastos del mes",
      value: stats?.monthlyExpense ?? 0,
      icon: ArrowDownRight,
      accent: "text-expense",
      bg: "bg-solbyt-blue-500/10",
    },
  ];

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="mt-3 h-7 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
        >
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg} ${card.accent}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 truncate text-2xl font-bold text-card-foreground">
              {formatMoney(card.value, code)}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
