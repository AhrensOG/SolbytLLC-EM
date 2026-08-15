"use client";

import { useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { ArrowLeftRight, Download, Plus } from "lucide-react";
import { useTeamTransactions } from "@/lib/hooks/useTeamTransactions";
import { useTeamCategories } from "@/lib/hooks/useTeamCategories";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import { useMe } from "@/lib/hooks/useMe";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { todayString } from "@/lib/format";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import type { Transaction } from "@/types";
import { cn } from "@/lib/cn";

const TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
];

export function TeamTransactionsView({ teamId }: { teamId: string }) {
  const { mutate } = useSWRConfig();
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const { data: transactions, isLoading } = useTeamTransactions(teamId, {
    type: type || undefined,
    month: month || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: categories } = useTeamCategories(teamId);
  const { data: me } = useMe();
  const currency = useDefaultCurrency();
  const code = currency?.code ?? "USD";

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/teams/${teamId}/transactions/${deleting.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeletingLoading(false);
      toast.error(body?.error ?? "No se pudo eliminar la transacción");
      return;
    }

    setDeletingLoading(false);
    setDeleting(null);
    toast.success("Transacción eliminada");
    await mutate((key) => typeof key === "string" && key.startsWith(`/api/teams/${teamId}`));
  }

  function handleExport() {
    if (!transactions || transactions.length === 0) {
      toast.info("No hay movimientos para exportar");
      return;
    }
    const csv = transactionsToCsv(
      transactions,
      currency?.code ?? "USD",
      currency?.exchangeRateToBase ?? 1,
    );
    downloadCsv(
      `equipo-movimientos-${todayString()}.csv`,
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
      </Card>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : !transactions || transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="No hay movimientos en el equipo"
            description="Agrega el primer ingreso o gasto compartido."
            action={
              <Link href={`/teams/${teamId}/transactions/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Nuevo movimiento
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
                onEdit={tx.userId === me?.id ? setEditing : undefined}
                onDelete={tx.userId === me?.id ? setDeleting : undefined}
              />
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar movimiento"
      >
        {editing && (
          <TransactionForm
            transaction={editing}
            teamId={teamId}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar movimiento"
      >
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar este movimiento? Esta acción no se puede
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
