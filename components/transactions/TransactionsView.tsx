"use client";

import { useState } from "react";
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
import { useTransactionTeams } from "@/lib/hooks/useTransactionTeams";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { todayString } from "@/lib/format";
import { TransactionItem } from "./TransactionItem";
import { TransactionForm } from "./TransactionForm";
import { RecurringForm } from "@/components/recurring/RecurringForm";
import { ShareModal } from "@/components/share/ShareModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [converting, setConverting] = useState<Transaction | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [removeFromTeams, setRemoveFromTeams] = useState<Set<string>>(new Set());

  const { data: transactions, isLoading } = useTransactions({
    type: type || undefined,
    month: month || undefined,
    categoryId: categoryId || undefined,
  });
  const {
    data: editingTeams,
    mutate: mutateEditingTeams,
  } = useTransactionTeams(editing?.id ?? null);
  const { data: deleteTeams } = useTransactionTeams(deleting?.id ?? null);
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

  function toggleRemoveTeam(teamId: string) {
    setRemoveFromTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function markAllTeams(checked: boolean) {
    if (!deleteTeams) return;
    setRemoveFromTeams(checked ? new Set(deleteTeams.map((t) => t.teamId)) : new Set());
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/transactions/${deleting.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeFromTeams: [...removeFromTeams] }),
    });

    if (!res.ok) {
      setDeletingLoading(false);
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo eliminar la transacción");
      return;
    }

    const data = await res.json();
    setDeletingLoading(false);
    setDeleting(null);
    setRemoveFromTeams(new Set());
    toast.success(
      (data?.removedTeams ?? 0) > 0
        ? `Transacción eliminada · y de ${data.removedTeams} equipo${data.removedTeams === 1 ? "" : "s"}`
        : "Transacción eliminada",
    );
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/transactions"),
    );
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
    await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
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

  async function handleRemoveFromTeam(teamId: string) {
    if (!editing) return;
    const res = await fetch(`/api/transactions/${editing.id}/teams/${teamId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo quitar del equipo");
      return;
    }
    await mutateEditingTeams();
    await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
    toast.success("Transacción quitada del equipo");
  }

  async function handleAddTeam(teamIds: string[]) {
    if (!editing) return;
    const res = await fetch("/api/share/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionIds: [editing.id], teamIds }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo compartir la transacción");
      return;
    }
    const result: ShareResult = await res.json();
    await mutateEditingTeams();
    await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
    toast.success(
      result.created > 0
        ? `Copiada a ${result.created} equipo${result.created === 1 ? "" : "s"}`
        : "Ya estaba en esos equipos",
    );
  }

  async function handleDuplicate(tx: Transaction) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: tx.type,
        amount: tx.amount,
        currencyId: tx.currencyId,
        description: tx.description,
        date: todayString(),
        categoryId: tx.categoryId,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo duplicar la transacción");
      return;
    }

    toast.success("Transacción duplicada");
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/transactions"),
    );
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
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
        <ListSkeleton rows={6} />
      ) : !transactions || transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="No hay transacciones"
            description="Agrega tu primer ingreso o gasto para empezar a llevar el control."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Nueva transacción
              </Button>
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
                onDelete={selectMode ? undefined : (tx) => {
                  setRemoveFromTeams(new Set());
                  setDeleting(tx);
                }}
                onDuplicate={selectMode ? undefined : handleDuplicate}
                onConvertRecurring={selectMode ? undefined : setConverting}
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
            sharedTeams={editingTeams ?? []}
            onRemoveFromTeam={(shared) => handleRemoveFromTeam(shared.teamId)}
            onAddTeam={handleAddTeam}
          />
        )}
      </Modal>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nueva transacción"
      >
        <TransactionForm onSuccess={() => setCreating(false)} />
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

        {(deleteTeams ?? []).length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Eliminar también de los equipos
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => markAllTeams(true)}
                  className="font-medium text-primary hover:underline"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={() => markAllTeams(false)}
                  className="font-medium text-muted-foreground hover:underline"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5">
              {(deleteTeams ?? []).map((shared) => {
                const checked = removeFromTeams.has(shared.teamId);
                return (
                  <li key={shared.teamId}>
                    <button
                      type="button"
                      onClick={() => toggleRemoveTeam(shared.teamId)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                        {shared.teamName}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={deletingLoading} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!converting}
        onClose={() => setConverting(null)}
        title="Convertir a recurrente"
      >
        {converting && (
          <RecurringForm
            teamId={converting.teamId ?? undefined}
            defaults={{
              name: converting.description || converting.category?.name || "",
              type: converting.type,
              amount: converting.amount,
              currencyId: converting.currencyId,
              categoryId: converting.categoryId,
              startDate: todayString(),
            }}
            onSuccess={() => setConverting(null)}
          />
        )}
      </Modal>
    </div>
  );
}
