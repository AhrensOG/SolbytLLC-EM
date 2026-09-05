"use client";

import { useTeam } from "@/lib/hooks/useTeam";
import { InviteForm } from "@/components/teams/InviteForm";
import { MemberList } from "@/components/teams/MemberList";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export function MembersView({ teamId }: { teamId: string }) {
  const { data: team, isLoading } = useTeam(teamId);

  if (isLoading || !team) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </Card>
        <ListSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <InviteForm teamId={teamId} />
      </Card>

      <MemberList teamId={teamId} isAdmin={team.role === "admin"} />
    </div>
  );
}