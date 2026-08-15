"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Target, Users } from "lucide-react";
import { useTeamGoal } from "@/lib/hooks/useTeamGoal";
import { useMe } from "@/lib/hooks/useMe";
import { formatMoney } from "@/lib/format";
import { GoalForm, MemberGoalForm } from "./GoalForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";
import type { Team } from "@/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ProgressBar({
  progress,
  goal,
  color = "#a855f7",
}: {
  progress: number;
  goal: number;
  color?: string;
}) {
  const pct = goal > 0 ? clamp((progress / goal) * 100, 0, 100) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

interface GoalViewProps {
  teamId: string;
  team: Team;
  isAdmin: boolean;
}

export function GoalView({ teamId, team, isAdmin }: GoalViewProps) {
  const { data: goal, isLoading } = useTeamGoal(teamId);
  const { data: me } = useMe();
  const [editingGroup, setEditingGroup] = useState(false);
  const [editingMember, setEditingMember] = useState<{
    userId: string;
    name: string;
    goalAmount: number | null;
  } | null>(null);

  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Card className="space-y-4 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </Card>
        <ListSkeleton rows={3} />
      </div>
    );

  const symbol = goal?.currency.symbol ?? "$";
  const groupProgress = goal?.progress ?? 0;
  const hasGroupGoal = goal?.goalAmount != null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Target className="h-5 w-5 text-solbyt-purple-500" /> Meta del equipo
          </h3>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setEditingGroup(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>

        {!hasGroupGoal ? (
          <EmptyState
            icon={Target}
            title="Sin meta definida"
            description={
              isAdmin
                ? "Define un monto objetivo de ahorro acumulado para el equipo."
                : "El admin aún no define una meta para el equipo."
            }
            action={
              isAdmin ? (
                <Button size="sm" onClick={() => setEditingGroup(true)}>
                  Definir meta
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {formatMoney(Math.max(groupProgress, 0), goal?.currency.code ?? "USD")}
                  <span className="text-base font-medium text-muted-foreground">
                    {" "}
                    / {formatMoney(goal?.goalAmount ?? 0, goal?.currency.code ?? "USD")}
                  </span>
                </p>
              </div>
              <span className="text-sm font-semibold text-solbyt-purple-500">
                {goal && goal.goalAmount
                  ? `${Math.round(clamp((groupProgress / goal.goalAmount) * 100, 0, 100))}%`
                  : "0%"}
              </span>
            </div>
            <ProgressBar progress={groupProgress} goal={goal?.goalAmount ?? 0} />
            <p className="text-xs text-muted-foreground">
              La meta se mide con el balance acumulado del equipo (ingresos menos
              gastos) en {goal?.currency.code ?? "USD"} ({symbol}).
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Users className="h-5 w-5 text-solbyt-blue-500" /> Metas individuales
        </h3>
        {(goal?.members ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay miembros en el equipo.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {goal?.members.map((member) => {
              const canEdit = isAdmin || member.userId === me?.id;
              return (
                <li key={member.userId} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">
                      {member.name}
                      {member.userId === me?.id && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => setEditingMember(member)}
                        aria-label="Editar meta individual"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {member.goalAmount == null ? (
                    <p className="text-xs text-muted-foreground">Sin meta individual.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-card-foreground">
                          {formatMoney(Math.max(member.progress, 0), goal?.currency.code ?? "USD")}
                          <span className="text-muted-foreground">
                            {" "}
                            / {formatMoney(member.goalAmount, goal?.currency.code ?? "USD")}
                          </span>
                        </span>
                        <span className="font-semibold text-solbyt-blue-500">
                          {Math.round(clamp((member.progress / member.goalAmount) * 100, 0, 100))}%
                        </span>
                      </div>
                      <ProgressBar
                        progress={member.progress}
                        goal={member.goalAmount}
                        color="#3b82f6"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={editingGroup}
        onClose={() => setEditingGroup(false)}
        title="Meta del equipo"
      >
        <GoalForm
          teamId={teamId}
          team={team}
          onSuccess={() => setEditingGroup(false)}
        />
      </Modal>

      <Modal
        open={!!editingMember}
        onClose={() => setEditingMember(null)}
        title="Meta individual"
      >
        {editingMember && (
          <MemberGoalForm
            teamId={teamId}
            member={editingMember}
            onSuccess={() => setEditingMember(null)}
          />
        )}
      </Modal>
    </div>
  );
}
