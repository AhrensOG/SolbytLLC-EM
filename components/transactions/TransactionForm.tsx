"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TeamPicker } from "@/components/teams/TeamPicker";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTeamCategories } from "@/lib/hooks/useTeamCategories";
import { useCurrencies } from "@/lib/hooks/useCurrencies";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import type { ShareResult, Transaction, TransactionType } from "@/types";
import type { SharedTeam } from "@/lib/hooks/useTransactionTeams";
import { todayString } from "@/lib/format";
import { cn } from "@/lib/cn";

interface TransactionFormProps {
  transaction?: Transaction;
  teamId?: string;
  onSuccess?: () => void;
  sharedTeams?: SharedTeam[];
  onRemoveFromTeam?: (shared: SharedTeam) => void;
  onAddTeam?: (teamIds: string[]) => Promise<void> | void;
}

export function TransactionForm({
  transaction,
  teamId,
  onSuccess,
  sharedTeams,
  onRemoveFromTeam,
  onAddTeam,
}: TransactionFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [currencyId, setCurrencyId] = useState(transaction?.currencyId ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayString());
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [copyToPersonal, setCopyToPersonal] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const { data: currencies } = useCurrencies();
  const defaultCurrency = useDefaultCurrency();
  const personalCategories = useCategories({ type });
  const teamCategories = useTeamCategories(teamId ?? "", { type });

  const categories = teamId
    ? teamCategories.data ?? []
    : personalCategories.data ?? [];

  const isPersonalCreate = !teamId && !transaction;
  const effectiveCurrency =
    currencyId || defaultCurrency?.id || currencies?.[0]?.id || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type,
      amount: Number(amount),
      currencyId: effectiveCurrency,
      categoryId,
      description,
      date,
      ...(isPersonalCreate ? { shareTeamIds: [...selectedTeams] } : {}),
      ...(teamId && !transaction ? { copyToPersonal } : {}),
    };

    const base = teamId ? `/api/teams/${teamId}/transactions` : "/api/transactions";
    const url = transaction ? `${base}/${transaction.id}` : base;
    const res = await fetch(url, {
      method: transaction ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar la transacción");
      return;
    }

    setLoading(false);
    await mutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/transactions") ||
          (teamId ? key.startsWith(`/api/teams/${teamId}`) : false)),
    );
    await mutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/stats") ||
          (teamId ? key.startsWith(`/api/teams/${teamId}`) : false)),
    );

    let message = transaction
      ? "Transacción actualizada"
      : teamId
        ? "Transacción agregada al equipo"
        : "Transacción agregada";
    if (!transaction && !teamId && selectedTeams.size > 0) {
      const result = (await res.json().catch(() => null)) as
        | (ShareResult & { transaction?: Transaction })
        | null;
      const created = result?.created ?? 0;
      const skipped = result?.skipped ?? 0;
      if (created > 0) {
        message += ` · ${created} copiadas a equipos`;
      }
      if (skipped > 0) {
        message += ` · ${skipped} ya existían`;
      }
      await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
    }
    toast.success(message);

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(teamId ? `/teams/${teamId}/transactions` : "/transactions");
    }
  }

  async function handleShareToTeam() {
    if (addSelected.size === 0 || !onAddTeam) return;
    await onAddTeam([...addSelected]);
    setAddSelected(new Set());
    setAddOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors",
            type === "expense"
              ? "border-expense bg-solbyt-blue-500/10 text-expense"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <ArrowDownRight className="h-4 w-4" /> Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors",
            type === "income"
              ? "border-income bg-solbyt-pink-500/10 text-income"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <ArrowUpRight className="h-4 w-4" /> Ingreso
        </button>
      </div>

      <Input
        label="Monto"
        name="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Select
        label="Categoría"
        name="categoryId"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Selecciona una categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Descripción"
        name="description"
        placeholder="Ej: Compra del supermercado"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Select
          label="Moneda"
          name="currencyId"
          value={effectiveCurrency}
          onChange={(e) => setCurrencyId(e.target.value)}
          required
        >
          {(currencies ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} ({c.symbol})
            </option>
          ))}
        </Select>
      </div>

      {isPersonalCreate && (
        <TeamPicker
          selected={selectedTeams}
          onChange={setSelectedTeams}
          label="Compartir al crear a equipos"
          hint="La transacción se guardará en tu área personal y se copiará a los equipos seleccionados."
        />
      )}

      {transaction && !teamId && (sharedTeams ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Equipos donde está esta transacción
          </span>
          <ul className="flex flex-col gap-1.5">
            {(sharedTeams ?? []).map((shared) => (
              <li
                key={shared.teamId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span className="truncate text-sm font-medium text-card-foreground">
                  {shared.teamName}
                </span>
                {onRemoveFromTeam && (
                  <button
                    type="button"
                    onClick={() => onRemoveFromTeam(shared)}
                    className="text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 rounded-md px-2 py-1"
                  >
                    Quitar del equipo
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {transaction && !teamId && !addOpen && onAddTeam && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="self-start"
        >
          <Plus className="h-4 w-4" /> Compartir a otro equipo
        </Button>
      )}

      {transaction && !teamId && addOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <TeamPicker
            selected={addSelected}
            onChange={setAddSelected}
            label="Equipos"
            hint="Selecciona los equipos a los que copiar esta transacción."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddSelected(new Set());
                setAddOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={addSelected.size === 0}
              onClick={handleShareToTeam}
            >
              Compartir
            </Button>
          </div>
        </div>
      )}

      {teamId && !transaction && (
        <label className="flex items-center gap-2 text-sm text-card-foreground">
          <input
            type="checkbox"
            checked={copyToPersonal}
            onChange={(e) => setCopyToPersonal(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Crear también en mi área personal
        </label>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {transaction ? "Guardar cambios" : "Agregar transacción"}
      </Button>
    </form>
  );
}