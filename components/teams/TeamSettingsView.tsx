"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { TeamForm } from "./TeamForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Team } from "@/types";

export function TeamSettingsView({ team }: { team: Team }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleting(false);
      toast.error(body?.error ?? "No se pudo eliminar el equipo");
      return;
    }

    setDeleting(false);
    setConfirmDelete(false);
    await mutate("/api/teams");
    toast.success("Equipo eliminado");
    router.push("/teams");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-card-foreground">
          Información del equipo
        </h3>
        <TeamForm team={team} />
      </Card>

      <Card className="border-destructive/40 p-6">
        <h3 className="mb-2 text-base font-semibold text-destructive">
          Zona de peligro
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Eliminar el equipo borrará todos sus movimientos, categorías y
          miembros. Esta acción no se puede deshacer.
        </p>
        <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
          Eliminar equipo
        </Button>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar equipo"
      >
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar el equipo{" "}
          <span className="font-medium text-card-foreground">{team.name}</span>?
          Se perderán todos sus datos.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={deleting} onClick={handleDelete}>
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
