import { TeamCategoriesView } from "@/components/teams/TeamCategoriesView";

export default async function TeamCategoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">Categorías</h2>
        <p className="text-sm text-muted-foreground">
          Categorías compartidas del equipo.
        </p>
      </header>

      <TeamCategoriesView teamId={id} />
    </div>
  );
}
