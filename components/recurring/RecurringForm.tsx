"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTeamCategories } from "@/lib/hooks/useTeamCategories";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { useCurrencies } from "@/lib/hooks/useCurrencies";
import { useTeams } from "@/lib/hooks/useTeams";
import { useMe } from "@/lib/hooks/useMe";
import { todayString } from "@/lib/format";
import type { Frequency, RecurringExpense, TransactionType } from "@/types";
import { cn } from "@/lib/cn";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

interface RecurringFormProps {
  recurring?: RecurringExpense;
  teamId?: string;
  onSuccess?: () => void;
}

export function RecurringForm({
  recurring,
  teamId,
  onSuccess,
}: RecurringFormProps) {
  const { mutate } = useSWRConfig();
  const [name, setName] = useState(recurring?.name ?? "");
  const [type, setType] = useState<TransactionType>(recurring?.type ?? "expense");
  const [amount, setAmount] = useState(recurring ? String(recurring.amount) : "");
  const [currencyId, setCurrencyId] = useState(recurring?.currencyId ?? "");
  const [categoryId, setCategoryId] = useState(recurring?.categoryId ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    recurring?.frequency ?? "monthly",
  );
  const [startDate, setStartDate] = useState(
    recurring?.startDate ?? todayString(),
  );
  const [endDate, setEndDate] = useState(recurring?.endDate ?? "");
  const [active, setActive] = useState(recurring?.active ?? true);
  const [teamIds, setTeamIds] = useState<Set<string>>(
    new Set(recurring?.teamIds ?? []),
  );
  const [payedByUserId, setPayedByUserId] = useState(
    recurring?.payedByUserId ?? "",
  );
  const [loading, setLoading] = useState(false);

  const { data: currencies } = useCurrencies();
  const { data: me } = useMe();
  const personalCategories = useCategories({ type });
  const teamCategories = useTeamCategories(teamId ?? "", { type });
  const { data: members } = useTeamMembers(teamId ?? "");
  const { data: teams } = useTeams();

  const categories = teamId
    ? (teamCategories.data ?? [])
    : (personalCategories.data ?? []);
  const filteredCategories = categories.filter((c) => c.type === type);

  function toggleTeam(teamIdValue: string) {
    setTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamIdValue)) next.delete(teamIdValue);
      else next.add(teamIdValue);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = teamId
      ? {
          name,
          type,
          amount: Number(amount),
          currencyId,
          categoryId,
          frequency,
          startDate,
          endDate: endDate || null,
          active,
          teamId,
          payedByUserId: payedByUserId || me?.id || null,
        }
      : {
          name,
          type,
          amount: Number(amount),
          currencyId,
          categoryId,
          frequency,
          startDate,
          endDate: endDate || null,
          active,
          teamIds: [...teamIds],
        };

    const url = recurring
      ? `/api/recurring-expenses/${recurring.id}`
      : "/api/recurring-expenses";
    const res = await fetch(url, {
      method: recurring ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar el recurrente");
      return;
    }

    setLoading(false);
    await mutate((key) =>
      typeof key === "string" && key.startsWith("/api/recurring-expenses"),
    );
    toast.success(recurring ? "Recurrente actualizado" : "Recurrente creado");
    onSuccess?.();
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
        label="Nombre"
        name="name"
        placeholder="Ej: Abogado mensual"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
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
          label="Moneda"
          value={currencyId}
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

      <Select
        label="Categoría"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Selecciona una categoría</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        label="Frecuencia"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as Frequency)}
      >
        {FREQUENCY_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="Fecha de fin (opcional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          hint="Vacío = sin fin"
        />
      </div>

      {teamId ? (
        <Select
          label="¿Quién paga?"
          value={payedByUserId || me?.id || ""}
          onChange={(e) => setPayedByUserId(e.target.value)}
        >
          {(members ?? []).map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </Select>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Compartir a equipos
          </span>
          {!teams || teams.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tienes equipos. Solo se generará en tu área personal.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => {
                const checked = teamIds.has(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeam(team.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {recurring && (
        <label className="flex items-center gap-2 text-sm text-card-foreground">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Activo
        </label>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {recurring ? "Guardar cambios" : "Crear recurrente"}
      </Button>
    </form>
  );
}
