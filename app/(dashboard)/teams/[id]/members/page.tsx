import { MembersView } from "@/components/teams/MembersView";

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">Miembros</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona quién forma parte del equipo.
        </p>
      </header>

      <MembersView teamId={id} />
    </div>
  );
}