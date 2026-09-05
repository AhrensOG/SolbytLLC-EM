import { TeamSettingsView } from "@/components/teams/TeamSettingsView";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">Ajustes del equipo</h2>
        <p className="text-sm text-muted-foreground">
          Edita la información o elimina el equipo.
        </p>
      </header>

      <TeamSettingsView teamId={id} />
    </div>
  );
}