"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useTeamStats } from "@/lib/hooks/useTeamStats";
import { useTeamTransactions } from "@/lib/hooks/useTeamTransactions";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { useMe } from "@/lib/hooks/useMe";
import { currentMonth, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { MonthlyBars } from "@/components/dashboard/MonthlyBars";
import { CategoryChartCard } from "@/components/dashboard/CategoryChartCard";
import { TransactionItem } from "@/components/transactions/TransactionItem";

export function TeamDashboardView({ teamId }: { teamId: string }) {
  const [month, setMonth] = useState(currentMonth());
  const currency = useDefaultCurrency();
  const { data: stats, error } = useTeamStats(
    teamId,
    month,
    currency?.code,
  );
  const { data: transactions, isLoading: txLoading } = useTeamTransactions(teamId);
  const { data: me } = useMe();
  const code = stats?.currency.code ?? currency?.code ?? "USD";

  if (error) {
    return <ErrorState message="No se pudo cargar el resumen del equipo." />;
  }

  const cards = [
    {
      label: "Balance del equipo",
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

  const members = stats?.byMember ?? [];
  const recent = (transactions ?? []).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

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

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <BarChart3 className="h-5 w-5 text-solbyt-purple-500" />
          Últimos 6 meses
        </h3>
        <MonthlyBars data={stats?.monthlySeries ?? []} currencyCode={code} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CategoryChartCard
            expenses={stats?.byCategory ?? []}
            incomes={stats?.incomeByCategory ?? []}
            currencyCode={code}
          />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold text-card-foreground">
            Control por miembro (mes)
          </h3>
          {members.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Sin movimientos este mes"
              description="Cuando los miembros registren movimientos, verás el control aquí."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member, i) => (
                <motion.li
                  key={member.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">
                      {member.name}
                      {member.userId === me?.id && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </span>
                    <div className="flex gap-3 text-sm">
                      <span className="text-income">
                        +{formatMoney(member.income, code)}
                      </span>
                      <span className="text-expense">
                        -{formatMoney(member.expense, code)}
                      </span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-card-foreground">
            Últimos movimientos
          </h3>
          <Link
            href={`/teams/${teamId}/transactions`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {txLoading && !transactions ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Cargando movimientos...
          </p>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Sin movimientos"
            description="Agrega el primer movimiento compartido del equipo."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {recent.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} currencyCode={code} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
