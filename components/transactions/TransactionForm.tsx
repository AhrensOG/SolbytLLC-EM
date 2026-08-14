"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTeamCategories } from "@/lib/hooks/useTeamCategories";
import { useCurrencies } from "@/lib/hooks/useCurrencies";
import { useDefaultCurrency } from "@/lib/hooks/useDefaultCurrency";
import type { Transaction, TransactionType } from "@/types";
import { todayString } from "@/lib/format";
import { cn } from "@/lib/cn";

interface TransactionFormProps {
  transaction?: Transaction;
  teamId?: string;
  onSuccess?: () => void;
}

export function TransactionForm({ transaction, teamId, onSuccess }: TransactionFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [currencyId, setCurrencyId] = useState(transaction?.currencyId ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(
    transaction?.date ?? todayString(),
  );
  const [loading, setLoading] = useState(false);

  const { data: currencies } = useCurrencies();
  const defaultCurrency = useDefaultCurrency();
  const personalCategories = useCategories({ type });
  const teamCategories = useTeamCategories(teamId ?? "", { type });

  const categories = teamId
    ? teamCategories.data ?? []
    : personalCategories.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type,
      amount: Number(amount),
      currencyId: currencyId || defaultCurrency?.id || currencies?.[0]?.id || "",
      categoryId,
      description,
      date,
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

    toast.success(transaction ? "Transacción actualizada" : "Transacción agregada");

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(teamId ? `/teams/${teamId}/transactions` : "/transactions");
    }
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

      <Button type="submit" loading={loading} className="w-full">
        {transaction ? "Guardar cambios" : "Agregar transacción"}
      </Button>
    </form>
  );
}
