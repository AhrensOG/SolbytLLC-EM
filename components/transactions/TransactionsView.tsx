"use client";

import { useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  CheckSquare,
  Download,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { todayString } from "@/lib/format";
import { TransactionItem } from "./TransactionItem";
import { TransactionForm } from "./TransactionForm";
import { ShareModal } from "@/components/share/ShareModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import type { ShareResult, Transaction } from "@/types";
import { cn } from "@/lib/cn";

const TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
];

export function TransactionsView() {
  const { mutate } = useSWRConfig();
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);

  const { data: transactions, isLoading } = useTransactions({
    type: type || undefined,
    month: month || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: categories } = useCategories();
  const currency = useDefaultCurrency();
  const code = currency?.code ?? "USD";

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleShare(teamIds: string[]): Promise<void> {
    const res = await fetch("/api/share/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionIds: [...selected], teamIds }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo compartir");
      return;
    }

    const result: ShareResult = await res.json();
    toast.success(
      `${result.created} copiada${result.created === 1 ? "" : "s"}${
        result.skipped > 0
          ? ` · ${result.skipped} ya existían y se saltaron`
          : ""
      }`,
    );
    await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
    exitSelectMode();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/transactions/${deleting.id}`, { method: "DELETE" });

    if (!res.ok) {
      setDeletingLoading(false);
      toast.error("No se pudo eliminar la transacción");
      return;
    }

    setDeletingLoading(false);
    setDeleting(null);
    toast.success("Transacción eliminada");
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/transactions"),
    );
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
  }

  function handleExport() {
    if (!transactions || transactions.length === 0) {
      toast.info("No hay transacciones para exportar");
      return;
    }
    const csv = transactionsToCsv(
      transactions,
      currency?.code ?? "USD",
      currency?.exchangeRateToBase ?? 1,
    );
    downloadCsv(
      `transacciones-${todayString()}.csv`,
      csv,
    );
    toast.success("CSV exportado");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Todas</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Mes"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <Button variant="outline" size="md" onClick={handleExport} className="shrink-0">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>

        {selectMode ? (
          <Button variant="ghost" size="md" onClick={exitSelectMode} className="shrink-0">
            <X className="h-4 w-4" /> Cancelar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="md"
            onClick={() => setSelectMode(true)}
            className="shrink-0"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Seleccionar</span>
          </Button>
        )}
      </Card>

      {selectMode && transactions && transactions.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-3">
          <span className="text-sm font-medium text-card-foreground">
            {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
          </span>
          <Button
            size="sm"
            disabled={selected.size === 0}
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4" /> Compartir a equipos
          </Button>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : !transactions || transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="No hay transacciones"
            description="Agrega tu primer ingreso o gasto para empezar a llevar el control."
            action={
              <Link href="/transactions/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Nueva transacción
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col divide-y divide-border p-2">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                currencyCode={code}
                onEdit={selectMode ? undefined : setEditing}
                onDelete={selectMode ? undefined : setDeleting}
                selectable={selectMode}
                selected={selected.has(tx.id)}
                onToggleSelect={() => toggleSelect(tx.id)}
              />
            ))}
          </div>
        </Card>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Compartir a equipos"
        description={`Las ${selected.size} transacciones seleccionadas se copiarán a los equipos elegidos (las categorías se crearán automáticamente si no existen).`}
        onConfirm={handleShare}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar transacción"
      >
        {editing && (
          <TransactionForm
            transaction={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar transacción"
      >
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar esta transacción? Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={deletingLoading} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
