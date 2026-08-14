"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Check, Inbox, X } from "lucide-react";
import { useInvitations } from "@/lib/hooks/useInvitations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";

export function InvitationsView() {
  const { mutate } = useSWRConfig();
  const { data: invitations, isLoading } = useInvitations();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAction(invitationId: string, teamId: string, action: "accept" | "reject") {
    setPendingId(invitationId);
    const res = await fetch(`/api/teams/${teamId}/invitations/${invitationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setPendingId(null);
      toast.error(body?.error ?? "No se pudo procesar la invitación");
      return;
    }

    setPendingId(null);
    await mutate("/api/invitations");
    await mutate("/api/teams");

    if (action === "accept") {
      toast.success("Te uniste al equipo");
    } else {
      toast.success("Invitación rechazada");
    }
  }

  if (isLoading) return <PageLoader />;

  const pending = (invitations ?? []).filter((i) => i.status === "pending");

  if (pending.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Inbox}
          title="No tienes invitaciones"
          description="Cuando alguien te invite a un equipo, aparecerá aquí."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((inv) => (
        <Card key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-card-foreground">
              Equipo <span className="font-semibold">{inv.teamName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Invitado por {inv.invitedByName ?? "un miembro del equipo"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={pendingId === inv.id}
              onClick={() => handleAction(inv.id, inv.teamId, "accept")}
            >
              <Check className="h-4 w-4" /> Aceptar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pendingId === inv.id}
              onClick={() => handleAction(inv.id, inv.teamId, "reject")}
            >
              <X className="h-4 w-4" /> Rechazar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
