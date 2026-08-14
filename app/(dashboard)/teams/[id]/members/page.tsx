import { redirect } from "next/navigation";
import { getTeamForUser } from "@/lib/team-data";
import { InviteForm } from "@/components/teams/InviteForm";
import { MemberList } from "@/components/teams/MemberList";
import { Card } from "@/components/ui/Card";

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTeamForUser(id);
  if (!result) redirect("/teams");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">Miembros</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona quién forma parte del equipo.
        </p>
      </header>

      <Card className="p-4">
        <InviteForm teamId={id} />
      </Card>

      <MemberList teamId={id} isAdmin={result.role === "admin"} />
    </div>
  );
}
