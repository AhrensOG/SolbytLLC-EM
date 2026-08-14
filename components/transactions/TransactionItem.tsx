"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

interface TransactionItemProps {
  transaction: Transaction;
  currencyCode?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function TransactionItem({
  transaction,
  currencyCode = "USD",
  onEdit,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const color = transaction.category?.color ?? (isIncome ? "#ec4899" : "#3b82f6");

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60">
      {selectable && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          aria-label="Seleccionar transacción"
          className="h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
      )}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f` }}
      >
        <CategoryIcon name={transaction.category?.icon} className="h-5 w-5" style={{ color }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">
          {transaction.description || transaction.category?.name || "Sin descripción"}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.category?.name} · {formatDate(transaction.date)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <span
          className={cn(
            "text-sm font-semibold",
            isIncome ? "text-income" : "text-expense",
          )}
        >
          {isIncome ? "+" : "-"}
          {formatMoney(transaction.amount, currencyCode)}
        </span>

        {!selectable && (onEdit || onDelete) && (
          <div className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                aria-label="Editar"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction)}
                aria-label="Eliminar"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
