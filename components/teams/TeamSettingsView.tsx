"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { TeamForm } from "./TeamForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTeam } from "@/lib/hooks/useTeam";

export function TeamSettingsView({ teamId }: { teamId: string }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: team, isLoading } = useTeam(teamId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading || !team) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </Card>
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-48" />
        </Card>
      </div>
    );
  }

  if (team.role !== "admin") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-solbyt-purple-500" />
          <p className="text-sm text-muted-foreground">
            Solo los administradores pueden editar o eliminar este equipo.
          </p>
        </div>
      </Card>
    );
  }

  const currentTeam = team;

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/teams/${currentTeam.id}`, { method: "DELETE" });

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
          Eliminar el equipo borrará todas sus transacciones, categorías y
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
          <span className="font-medium text-card-foreground">{currentTeam.name}</span>?
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
