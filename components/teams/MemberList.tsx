"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Shield, Trash2 } from "lucide-react";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { useMe } from "@/lib/hooks/useMe";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import type { TeamMemberInfo } from "@/types";

export function MemberList({ teamId, isAdmin }: { teamId: string; isAdmin: boolean }) {
  const { mutate } = useSWRConfig();
  const { data: members, isLoading } = useTeamMembers(teamId);
  const { data: me } = useMe();
  const [removing, setRemoving] = useState<TeamMemberInfo | null>(null);
  const [removingLoading, setRemovingLoading] = useState(false);

  async function handleRoleChange(member: TeamMemberInfo, role: "admin" | "member") {
    const res = await fetch(`/api/teams/${teamId}/members/${member.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo cambiar el rol");
      return;
    }

    await mutate(`/api/teams/${teamId}/members`);
    toast.success("Rol actualizado");
  }

  async function handleRemove() {
    if (!removing) return;
    setRemovingLoading(true);

    const res = await fetch(`/api/teams/${teamId}/members/${removing.userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setRemovingLoading(false);
      toast.error(body?.error ?? "No se pudo eliminar el miembro");
      return;
    }

    setRemovingLoading(false);
    setRemoving(null);
    await mutate(`/api/teams/${teamId}/members`);
    toast.success("Miembro eliminado del equipo");
  }

  if (isLoading) return <ListSkeleton rows={4} />;

  return (
    <div className="flex flex-col gap-2">
      {(members ?? []).map((member) => {
        const isSelf = member.userId === me?.id;
        const canRemove = isAdmin || isSelf;
        return (
          <Card key={member.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-solbyt-purple-500 text-sm font-semibold text-white">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-card-foreground">
                {member.name}
                {isSelf && (
                  <span className="text-xs text-muted-foreground">(tú)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                {member.role === "admin" && (
                  <Shield className="h-4 w-4 text-solbyt-purple-500" />
                )}
                <Select
                  aria-label="Rol"
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member, e.target.value as "admin" | "member")
                  }
                  className="h-8 w-28 py-1 text-xs"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </Select>
                {canRemove && (
                  <button
                    onClick={() => setRemoving(member)}
                    aria-label="Eliminar miembro"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                {member.role === "admin" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-solbyt-purple-500">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
                {canRemove && (
                  <button
                    onClick={() => setRemoving(member)}
                    aria-label="Salir del equipo"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </Card>
        );
      })}

      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing?.userId === me?.id ? "Salir del equipo" : "Eliminar miembro"}
      >
        <p className="text-sm text-muted-foreground">
          {removing?.userId === me?.id
            ? "¿Seguro que quieres salir de este equipo?"
            : `¿Seguro que quieres eliminar a ${removing?.name} del equipo?`}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={removingLoading} onClick={handleRemove}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
