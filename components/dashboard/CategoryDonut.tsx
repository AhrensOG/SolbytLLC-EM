"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

interface DonutSlice {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

interface CategoryDonutProps {
  data: DonutSlice[];
  currencyCode: string;
}

export function CategoryDonut({ data, currencyCode }: CategoryDonutProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="Sin gastos este mes"
        description="Registra gastos para ver el desglose por categoría."
      />
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((slice) => (
              <Cell key={slice.categoryId} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currencyCode)}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--card-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
