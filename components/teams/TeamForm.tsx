"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Team } from "@/types";

interface TeamFormProps {
  team?: Team;
  onSuccess?: () => void;
}

export function TeamForm({ team, onSuccess }: TeamFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = team ? `/api/teams/${team.id}` : "/api/teams";
    const res = await fetch(url, {
      method: team ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo guardar el equipo");
      return;
    }

    const created = await res.json();

    setLoading(false);
    await mutate("/api/teams");
    toast.success(team ? "Equipo actualizado" : "Equipo creado");

    if (onSuccess) {
      onSuccess();
    } else if (!team) {
      router.push(`/teams/${created.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre del equipo"
        name="name"
        placeholder="Ej: Los 3 hermanos"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Ej: Control de gastos compartidos"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" loading={loading} className="w-full">
        {team ? "Guardar cambios" : "Crear equipo"}
      </Button>
    </form>
  );
}
