"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatMonthShort, formatMoney } from "@/lib/format";
import type { MonthSeriesPoint } from "@/types";

interface MonthlyBarsProps {
  data: MonthSeriesPoint[];
  currencyCode: string;
}

export function MonthlyBars({ data, currencyCode }: MonthlyBarsProps) {
  const chartData = data.map((p) => ({
    ...p,
    label: formatMonthShort(p.month),
  }));

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v) => String(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            formatter={(value, name) => [
              formatMoney(Number(value), currencyCode),
              name === "income" ? "Ingresos" : "Gastos",
            ]}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--card-foreground)",
            }}
          />
          <Bar dataKey="income" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
