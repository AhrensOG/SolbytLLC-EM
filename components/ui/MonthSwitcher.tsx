"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, shiftMonth } from "@/lib/format";

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mes anterior"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <label className="relative flex items-center">
        <span className="min-w-28 text-center text-sm font-medium capitalize text-card-foreground">
          {formatMonth(month)}
        </span>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Seleccionar mes"
        />
      </label>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Mes siguiente"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
