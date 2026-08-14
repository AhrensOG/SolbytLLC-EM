import { TeamForm } from "@/components/teams/TeamForm";
import { Card } from "@/components/ui/Card";

export default function NewTeamPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Nuevo equipo</h1>
        <p className="text-sm text-muted-foreground">
          Crea un equipo para compartir finanzas con otros usuarios.
        </p>
      </header>

      <Card className="p-6">
        <TeamForm />
      </Card>
    </div>
  );
}
