"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { useTeam } from "@/lib/hooks/useTeam";
import { TeamTabs } from "@/components/teams/TeamTabs";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading, error } = useTeam(id);
  const router = useRouter();

  useEffect(() => {
    if (error && (error as { status?: number }).status) {
      router.replace("/teams");
    }
  }, [error, router]);

  if (isLoading && !team) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/teams"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Equipos
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-2xl font-bold text-foreground">
              {team.name}
              {team.role === "admin" && (
                <Shield className="h-5 w-5 shrink-0 text-solbyt-purple-500" />
              )}
            </h1>
            {team.description && (
              <p className="truncate text-sm text-muted-foreground">
                {team.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <TeamTabs teamId={id} />
      {children}
    </div>
  );
}