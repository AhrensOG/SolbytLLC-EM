"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCurrencies } from "@/lib/hooks/useCurrencies";
import type { Team } from "@/types";

interface GoalFormProps {
  teamId: string;
  team: Team;
  onSuccess: () => void;
}

export function GoalForm({ teamId, team, onSuccess }: GoalFormProps) {
  const { mutate } = useSWRConfig();
  const { data: currencies } = useCurrencies();
  const [amount, setAmount] = useState(
    team.goalAmount != null ? String(team.goalAmount) : "",
  );
  const [currencyId, setCurrencyId] = useState(team.goalCurrencyId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = amount
      ? { goalAmount: Number(amount), goalCurrencyId: currencyId || null }
      : { goalAmount: null, goalCurrencyId: null };

    const res = await fetch(`/api/teams/${teamId}/goal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar la meta");
      return;
    }

    setLoading(false);
    await mutate(`/api/teams/${teamId}/goal`);
    await mutate("/api/teams");
    toast.success("Meta actualizada");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Monto objetivo"
        name="goalAmount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint="Deja vacío y guarda para quitar la meta."
      />
      <Select
        label="Moneda"
        value={currencyId}
        onChange={(e) => setCurrencyId(e.target.value)}
        required={!!amount}
      >
        <option value="">Seleccionar moneda</option>
        {(currencies ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} ({c.symbol})
          </option>
        ))}
      </Select>
      <Button type="submit" loading={loading} className="w-full">
        Guardar meta
      </Button>
    </form>
  );
}

interface MemberGoalFormProps {
  teamId: string;
  member: { userId: string; name: string; goalAmount: number | null };
  onSuccess: () => void;
}

export function MemberGoalForm({ teamId, member, onSuccess }: MemberGoalFormProps) {
  const { mutate } = useSWRConfig();
  const [amount, setAmount] = useState(
    member.goalAmount != null ? String(member.goalAmount) : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/teams/${teamId}/members/${member.userId}/goal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        individualGoalAmount: amount ? Number(amount) : null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar la meta");
      return;
    }

    setLoading(false);
    await mutate(`/api/teams/${teamId}/goal`);
    toast.success("Meta individual actualizada");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={`Meta de ${member.name}`}
        name="individualGoalAmount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint="Deja vacío y guarda para quitar la meta."
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setAmount("");
          }}
        >
          <Trash2 className="h-4 w-4" /> Quitar
        </Button>
        <Button type="submit" loading={loading}>
          Guardar meta
        </Button>
      </div>
    </form>
  );
}
