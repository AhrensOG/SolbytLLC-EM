"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { SummaryCards } from "./SummaryCards";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { RecentTransactions } from "./RecentTransactions";
import { MonthlyBars } from "./MonthlyBars";
import { UpcomingPayments } from "./UpcomingPayments";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { Card } from "@/components/ui/Card";
import { useStats } from "@/lib/hooks/useStats";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { currentMonth } from "@/lib/format";

export function DashboardView() {
  const { data: session } = useSession();
  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const [month, setMonth] = useState(currentMonth());
  const currency = useDefaultCurrency();
  const { data: stats } = useStats(month, currency?.code);
  const code = stats?.currency.code ?? currency?.code ?? "USD";
  const { mutate } = useSWRConfig();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    (async () => {
      const res = await fetch("/api/recurring-expenses/process", {
        method: "POST",
      }).catch(() => null);
      if (!res || !res.ok) return;
      const body = (await res.json().catch(() => ({}))) as { created?: number };
      if (body.created && body.created > 0) {
        toast.success(`Se aplicaron ${body.created} pagos recurrentes`);
        await mutate(
          (key) =>
            typeof key === "string" &&
            (key.startsWith("/api/transactions") ||
              key.startsWith("/api/stats") ||
              key.startsWith("/api/teams")),
        );
      }
    })();
  }, [mutate]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Este es el resumen de tus finanzas.
          </p>
        </div>
        <MonthSwitcher month={month} onChange={setMonth} />
      </header>

      <SummaryCards month={month} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
            <BarChart3 className="h-5 w-5 text-solbyt-purple-500" />
            Últimos 6 meses
          </h3>
          <MonthlyBars data={stats?.monthlySeries ?? []} currencyCode={code} />
        </Card>
        <UpcomingPayments />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactions />
        <CategoryBreakdown month={month} />
      </div>
    </div>
  );
}
