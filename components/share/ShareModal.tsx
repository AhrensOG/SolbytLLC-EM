"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (teamIds: string[]) => Promise<void>;
}

export function ShareModal({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Compartir",
  onConfirm,
}: ShareModalProps) {
  const { data: teams } = useTeams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  function toggle(teamId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;
    setLoading(true);
    await onConfirm([...selected]);
    setLoading(false);
    setSelected(new Set());
    onClose();
  }

  function handleClose() {
    setSelected(new Set());
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {!teams || teams.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            No tienes equipos. Crea uno primero para poder compartir.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {teams.map((team) => {
              const checked = selected.has(team.id);
              return (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => toggle(team.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-solbyt-purple-500/15 text-solbyt-purple-500">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                      {team.name}
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md border text-xs",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {checked ? "✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          onClick={handleConfirm}
          loading={loading}
          disabled={selected.size === 0}
          className="w-full"
        >
          {confirmLabel} ({selected.size} {selected.size === 1 ? "equipo" : "equipos"})
        </Button>
      </div>
    </Modal>
  );
}
