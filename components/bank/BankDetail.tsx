"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Landmark,
  Pencil,
  RefreshCw,
  Unlink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { TeamPicker } from "@/components/teams/TeamPicker";
import { useCategories } from "@/lib/hooks/useCategories";
import { todayString } from "@/lib/format";
import { cn } from "@/lib/cn";

interface BankConnectionInfo {
  id: string;
  institutionId: string;
  institutionName: string | null;
  accountName: string | null;
  accountIban: string | null;
  accountCurrency: string | null;
  status: string | null;
  validUntil: string | null;
  lastSyncedAt: string | null;
  pendingCount: number;
}

interface BankStatus {
  connections: BankConnectionInfo[];
  totalPending: number;
}

interface BankDraft {
  id: string;
  amount: number;
  currencyCode: string;
  bookingDate: string;
  description: string;
  categoryId: string | null;
  status: "pending" | "confirmed" | "rejected";
}

function shortIban(iban: string | null): string {
  if (!iban) return "";
  return `${iban.slice(0, 4)}••${iban.slice(-4)}`;
}

function money(draft: BankDraft) {
  const abs = Math.abs(draft.amount);
  const text = abs.toLocaleString("es", {
    style: "currency",
    currency: draft.currencyCode,
  });
  return `${draft.amount < 0 ? "-" : "+"}${text}`;
}

export function BankDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const { data: status } = useSWR<BankStatus>("/api/bank/status");
  const connection = status?.connections.find((c) => c.id === id);

  const { data: drafts, isLoading: draftsLoading } = useSWR<BankDraft[]>(
    id ? `/api/bank/drafts?connectionId=${id}` : null,
  );
  const { data: categories } = useCategories();

  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [teamIds, setTeamIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<BankDraft | null>(null);

  const pending = (drafts ?? []).filter((d) => d.status === "pending");

  function toggleSelect(draftId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) next.delete(draftId);
      else next.add(draftId);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function refreshBankData() {
    await mutate(`/api/bank/drafts?connectionId=${id}`);
    await mutate("/api/bank/status");
    await mutate((key) => typeof key === "string" && key.startsWith("/api/transactions"));
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
  }

  async function syncNow() {
    setSyncing(true);
    const res = await fetch(`/api/bank/sync?connectionId=${id}&days=30`, {
      method: "POST",
    });
    setSyncing(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo sincronizar la cuenta");
      return;
    }
    const data = await res.json();
    await refreshBankData();
    toast.success(
      data.created > 0
        ? `${data.created} movimiento${data.created === 1 ? "" : "s"} nuevo${data.created === 1 ? "" : "s"}`
        : "Sin movimientos nuevos",
    );
  }

  async function handleAction(draftId: string, action: "confirm" | "reject") {
    const categoryId = categoryMap[draftId] ?? pendingCategoryId;
    if (action === "confirm" && !categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }
    const res = await fetch(`/api/bank/drafts/${draftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, categoryId, teamIds: [...teamIds] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo procesar el movimiento");
      return;
    }
    await refreshBankData();
    toast.success(action === "confirm" ? "Movimiento confirmado" : "Movimiento descartado");
  }

  async function handleBulk(action: "confirm" | "reject", ids?: string[]) {
    const label = ids ? `${action}:${ids.length}` : `${action}:all`;
    setBulkLoading(label);

    const res = await fetch("/api/bank/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ids,
        categoryId: pendingCategoryId || undefined,
        categories: categoryMap,
        teamIds: action === "confirm" ? [...teamIds] : undefined,
      }),
    });

    setBulkLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo procesar la acción");
      return;
    }

    const data = await res.json();
    await refreshBankData();

    if (action === "confirm") {
      toast.success(
        data.skipped > 0
          ? `${data.confirmed} confirmados · ${data.skipped} requieren categoría`
          : `${data.confirmed} confirmados`,
      );
    } else {
      toast.success(`${data.rejected} ignorados`);
    }

    if (ids) clearSelection();
  }

  async function saveDraftEdit() {
    if (!editing) return;
    const res = await fetch(`/api/bank/drafts/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: editing.description,
        bookingDate: editing.bookingDate,
        amount: Math.abs(editing.amount) || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo guardar el cambio");
      return;
    }
    await mutate(`/api/bank/drafts?connectionId=${id}`);
    toast.success("Movimiento actualizado");
    setEditing(null);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch(`/api/bank/${id}`, { method: "DELETE" });
    setDisconnecting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo desconectar");
      return;
    }
    await mutate("/api/bank/status");
    toast.success("Cuenta desconectada");
    router.push("/bank");
    router.refresh();
  }

  if (!connection) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-2/3" />
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Landmark className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cuenta no encontrada.</p>
            <Button size="sm" variant="outline" onClick={() => router.push("/bank")}>
              <ArrowLeft className="h-4 w-4" /> Volver a Bancos
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push("/bank")}
        className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Bancos
      </button>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          {connection.accountName || connection.institutionName || "Cuenta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {connection.institutionName}
          {connection.accountIban ? ` · ${shortIban(connection.accountIban)}` : ""}
          {connection.accountCurrency ? ` · ${connection.accountCurrency}` : ""}
          {connection.validUntil
            ? ` · acceso hasta ${new Date(connection.validUntil).toLocaleDateString("es")}`
            : ""}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" loading={syncing} onClick={syncNow}>
          <RefreshCw className="h-4 w-4" /> Sincronizar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          loading={disconnecting}
          onClick={handleDisconnect}
        >
          <Unlink className="h-4 w-4" /> Desconectar
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">
            Movimientos pendientes
          </h3>
          {pending.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={bulkLoading === "confirm:all"}
                onClick={() => handleBulk("confirm")}
              >
                Confirmar todo
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={bulkLoading === "reject:all"}
                onClick={() => handleBulk("reject")}
              >
                Ignorar todos
              </Button>
            </div>
          )}
        </div>

        <TeamPicker
          selected={teamIds}
          onChange={setTeamIds}
          label="Compartir a equipos al confirmar"
          hint="Los movimientos que confirmes también se copiarán a los equipos seleccionados."
        />

        {pending.length > 0 && (
          <div className="mb-4 mt-4 flex items-center gap-2">
            <Select
              label="Categoría"
              value={pendingCategoryId}
              onChange={(e) => setPendingCategoryId(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Sin categoría</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3"
            >
              <span className="text-sm font-medium text-card-foreground">
                {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
              </span>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 }}
                >
                  <Button
                    size="sm"
                    loading={bulkLoading === `confirm:${selectedIds.size}`}
                    onClick={() => handleBulk("confirm", [...selectedIds])}
                  >
                    Confirmar seleccionados
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    loading={bulkLoading === `reject:${selectedIds.size}`}
                    onClick={() => handleBulk("reject", [...selectedIds])}
                  >
                    Ignorar seleccionados
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.16 }}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Limpiar selección"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {draftsLoading ? (
          <ListSkeleton rows={4} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Sin movimientos pendientes"
            description={
              connection.lastSyncedAt
                ? "Pulsa «Sincronizar» para buscar movimientos nuevos en tu banco."
                : "Aún no se ha sincronizado esta cuenta. Pulsa «Sincronizar»."
            }
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {pending.map((draft) => {
              const isSelected = selectedIds.has(draft.id);
              return (
                <li key={draft.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSelect(draft.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSelect(draft.id);
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">
                          {draft.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {draft.bookingDate} · {draft.currencyCode}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-semibold",
                          draft.amount < 0 ? "text-expense" : "text-income",
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                        {money(draft)}
                      </span>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Select
                        aria-label="Categoría"
                        value={categoryMap[draft.id] ?? draft.categoryId ?? ""}
                        onChange={(e) =>
                          setCategoryMap((prev) => ({
                            ...prev,
                            [draft.id]: e.target.value,
                          }))
                        }
                        className="h-9 w-full sm:w-40"
                      >
                        <option value="">Categoría</option>
                        {(categories ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2"
                        onClick={() => setEditing(draft)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 active:scale-[0.98] sm:flex-none"
                        onClick={() => handleAction(draft.id, "confirm")}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-muted-foreground active:scale-[0.98] sm:flex-none"
                        onClick={() => handleAction(draft.id, "reject")}
                      >
                        Ignorar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar movimiento"
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
            <Input
              label="Fecha"
              type="date"
              value={editing.bookingDate}
              max={todayString()}
              onChange={(e) =>
                setEditing({ ...editing, bookingDate: e.target.value })
              }
            />
            <Input
              label="Importe"
              type="number"
              step="0.01"
              min="0"
              value={Math.abs(editing.amount)}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  amount:
                    (editing.amount < 0 ? -1 : 1) * Math.abs(Number(e.target.value) || 0),
                })
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={saveDraftEdit}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}