import { redirect } from "next/navigation";
import { getTeamForUser } from "@/lib/team-data";
import { serializeTeam } from "@/lib/serialize";
import { GoalView } from "@/components/teams/GoalView";

export default async function TeamGoalPage({
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
        <h2 className="text-xl font-bold text-foreground">Meta de ahorro</h2>
        <p className="text-sm text-muted-foreground">
          Define objetivos de ahorro acumulado para el equipo y sus miembros.
        </p>
      </header>

      <GoalView
        teamId={id}
        team={serializeTeam(result.team, { role: result.role })}
        isAdmin={result.role === "admin"}
      />
    </div>
  );
}
