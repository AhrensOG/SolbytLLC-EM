"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Team } from "@/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TeamCard({ team, index = 0 }: { team: Team; index?: number }) {
  const hasGoal = team.goalAmount != null;
  const pct = hasGoal
    ? Math.round(clamp(((team.progress ?? 0) / (team.goalAmount ?? 1)) * 100, 0, 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <Link href={`/teams/${team.id}`} className="block h-full">
        <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-card-foreground">
                {team.name}
              </h3>
              {team.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {team.description}
                </p>
              )}
            </div>
            {team.role === "admin" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-solbyt-purple-500/10 px-2 py-0.5 text-xs font-medium text-solbyt-purple-500">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {team.memberCount ?? 1} {team.memberCount === 1 ? "miembro" : "miembros"}
          </div>

          {hasGoal && (
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> Meta
                </span>
                <span className="font-semibold text-solbyt-purple-500">{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-solbyt-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  );
}
