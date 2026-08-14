"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
} from "@/lib/default-categories";
import type { Category, TransactionType } from "@/types";
import { cn } from "@/lib/cn";

interface CategoryFormProps {
  category?: Category;
  teamId?: string;
  onSuccess?: () => void;
}

export function CategoryForm({ category, teamId, onSuccess }: CategoryFormProps) {
  const { mutate } = useSWRConfig();
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<TransactionType>(category?.type ?? "expense");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { name, type, color, icon };
    const base = teamId
      ? `/api/teams/${teamId}/categories`
      : "/api/categories";
    const url = category ? `${base}/${category.id}` : base;
    const res = await fetch(url, {
      method: category ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar la categoría");
      return;
    }

    setLoading(false);
    await mutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/categories") ||
          (teamId ? key.startsWith(`/api/teams/${teamId}`) : false)),
    );
    toast.success(category ? "Categoría actualizada" : "Categoría creada");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "rounded-lg border py-2.5 text-sm font-medium transition-colors",
            type === "expense"
              ? "border-expense bg-solbyt-blue-500/10 text-expense"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={cn(
            "rounded-lg border py-2.5 text-sm font-medium transition-colors",
            type === "income"
              ? "border-income bg-solbyt-pink-500/10 text-income"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          Ingreso
        </button>
      </div>

      <Input
        label="Nombre"
        name="name"
        placeholder="Ej: Comida"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Color</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                color === c && "ring-2 ring-ring ring-offset-2 ring-offset-card",
              )}
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Icono</span>
        <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
          {CATEGORY_ICON_OPTIONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcon(iconName)}
              aria-label={`Icono ${iconName}`}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                icon === iconName
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <CategoryIcon name={iconName} className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {category ? "Guardar cambios" : "Crear categoría"}
      </Button>
    </form>
  );
}
