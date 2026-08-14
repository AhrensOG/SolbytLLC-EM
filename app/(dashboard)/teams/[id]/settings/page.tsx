import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getTeamForUser } from "@/lib/team-data";
import { serializeTeam } from "@/lib/serialize";
import { TeamSettingsView } from "@/components/teams/TeamSettingsView";
import { Card } from "@/components/ui/Card";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTeamForUser(id);
  if (!result) redirect("/teams");

  if (result.role !== "admin") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-solbyt-purple-500" />
          <p className="text-sm text-muted-foreground">
            Solo los administradores pueden editar o eliminar este equipo.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">Ajustes del equipo</h2>
        <p className="text-sm text-muted-foreground">
          Edita la información o elimina el equipo.
        </p>
      </header>

      <TeamSettingsView team={serializeTeam(result.team, { role: result.role })} />
    </div>
  );
}
