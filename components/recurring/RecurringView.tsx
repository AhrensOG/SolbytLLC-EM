"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useRecurringExpenses } from "@/lib/hooks/useRecurringExpenses";
import { useTeams } from "@/lib/hooks/useTeams";
import { RecurringForm } from "./RecurringForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import {
  computeNextDate,
  FREQUENCY_LABELS,
} from "@/lib/recurring-engine";
import { formatDate, formatMoney } from "@/lib/format";
import type { RecurringExpense } from "@/types";
import { cn } from "@/lib/cn";

export function RecurringView({ teamId }: { teamId?: string }) {
  const { mutate } = useSWRConfig();
  const { data: recurring, isLoading } = useRecurringExpenses(teamId);
  const { data: teams } = useTeams();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleting, setDeleting] = useState<RecurringExpense | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const teamNameMap = new Map((teams ?? []).map((t) => [t.id, t.name]));

  async function handleToggleActive(item: RecurringExpense) {
    setTogglingId(item.id);

    const payload = item.teamId
      ? {
          name: item.name,
          type: item.type,
          amount: item.amount,
          currencyId: item.currencyId,
          categoryId: item.categoryId,
          frequency: item.frequency,
          startDate: item.startDate,
          endDate: item.endDate,
          active: !item.active,
          teamId: item.teamId,
          payedByUserId: item.payedByUserId,
        }
      : {
          name: item.name,
          type: item.type,
          amount: item.amount,
          currencyId: item.currencyId,
          categoryId: item.categoryId,
          frequency: item.frequency,
          startDate: item.startDate,
          endDate: item.endDate,
          active: !item.active,
          teamIds: item.teamIds,
        };

    const res = await fetch(`/api/recurring-expenses/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setTogglingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo actualizar");
      return;
    }

    await mutate((key) =>
      typeof key === "string" && key.startsWith("/api/recurring-expenses"),
    );
    toast.success(item.active ? "Recurrente pausado" : "Recurrente activado");
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/recurring-expenses/${deleting.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setDeletingLoading(false);
      toast.error("No se pudo eliminar el recurrente");
      return;
    }

    setDeletingLoading(false);
    setDeleting(null);
    await mutate((key) =>
      typeof key === "string" && key.startsWith("/api/recurring-expenses"),
    );
    toast.success("Recurrente eliminado");
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-4">
      {!recurring || recurring.length === 0 ? (
        <Card>
          <EmptyState
            icon={Repeat}
            title={
              teamId
                ? "El equipo no tiene recurrentes"
                : "No tienes pagos recurrentes"
            }
            description={
              teamId
                ? "Crea pagos o ingresos periódicos del equipo. Se aplican automáticamente al abrir la app."
                : "Crea gastos o ingresos que se repiten (ej: abogado mensual, sueldo). Se aplican automáticamente al abrir la app."
            }
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Crear recurrente
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {recurring.map((item) => {
              const nextDate = computeNextDate({
                frequency: item.frequency,
                startDate: item.startDate,
                endDate: item.endDate,
              });
              const isIncome = item.type === "income";
              return (
                <Card key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      isIncome
                        ? "bg-solbyt-pink-500/10 text-income"
                        : "bg-solbyt-blue-500/10 text-expense",
                    )}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground">
                        {item.name}
                      </span>
                      {!item.active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Pausado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[item.frequency]} ·{" "}
                      {nextDate
                        ? `próximo: ${formatDate(nextDate)}`
                        : "sin próximos pagos"}
                    </p>
                    {teamId ? (
                      item.payedByName && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <UserRound className="h-3 w-3" /> Paga: {item.payedByName}
                        </p>
                      )
                    ) : (
                      item.teamIds.length > 0 && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {item.teamIds
                            .map((id) => teamNameMap.get(id) ?? "Equipo")
                            .join(", ")}
                        </p>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isIncome ? "text-income" : "text-expense",
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatMoney(item.amount, item.currency?.code ?? "USD")}
                    </span>
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={togglingId === item.id}
                      aria-label={item.active ? "Pausar" : "Activar"}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                        item.active
                          ? "bg-muted text-muted-foreground hover:text-foreground"
                          : "bg-solbyt-purple-500/10 text-solbyt-purple-500 hover:bg-solbyt-purple-500/20",
                      )}
                    >
                      {togglingId === item.id
                        ? "..."
                        : item.active
                          ? "Pausar"
                          : "Activar"}
                    </button>
                    <button
                      onClick={() => setEditing(item)}
                      aria-label="Editar"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      aria-label="Eliminar"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Button variant="outline" onClick={() => setCreating(true)} className="self-start">
            <Plus className="h-4 w-4" /> Nuevo recurrente
          </Button>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo recurrente">
        <RecurringForm teamId={teamId} onSuccess={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar recurrente">
        {editing && (
          <RecurringForm
            recurring={editing}
            teamId={editing.teamId ?? undefined}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar recurrente">
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar el recurrente{" "}
          <span className="font-medium text-card-foreground">{deleting?.name}</span>?
          Las transacciones ya generadas no se borran.
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
