"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Plus, Users } from "lucide-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { useInvitations } from "@/lib/hooks/useInvitations";
import { TeamCard } from "./TeamCard";
import { TeamForm } from "./TeamForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";

export function TeamsView() {
  const { data: teams, isLoading } = useTeams();
  const { data: invitations } = useInvitations();
  const [creating, setCreating] = useState(false);

  const pendingCount = (invitations ?? []).filter((i) => i.status === "pending").length;

  return (
    <div className="flex flex-col gap-4">
      {pendingCount > 0 && (
        <Link href="/invitations">
          <Card className="flex items-center gap-3 border-solbyt-pink-500/50 bg-solbyt-pink-500/5 p-4 transition-colors hover:bg-solbyt-pink-500/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-solbyt-pink-500/15 text-solbyt-pink-500">
              <Mail className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">
                Tienes {pendingCount} {pendingCount === 1 ? "invitación pendiente" : "invitaciones pendientes"}
              </p>
              <p className="text-xs text-muted-foreground">
                Haz clic para revisarlas
              </p>
            </div>
          </Card>
        </Link>
      )}

      {isLoading ? (
        <PageLoader />
      ) : !teams || teams.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Aún no tienes equipos"
            description="Crea un equipo para compartir tus finanzas con otros usuarios."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Crear equipo
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, i) => (
              <TeamCard key={team.id} team={team} index={i} />
            ))}
          </div>
          <Button variant="outline" onClick={() => setCreating(true)} className="self-start">
            <Plus className="h-4 w-4" /> Nuevo equipo
          </Button>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Crear equipo">
        <TeamForm onSuccess={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
