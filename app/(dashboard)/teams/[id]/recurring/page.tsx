import { redirect } from "next/navigation";
import { getTeamForUser } from "@/lib/team-data";
import { RecurringView } from "@/components/recurring/RecurringView";

export default async function TeamRecurringPage({
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
        <h2 className="text-xl font-bold text-foreground">
          Recurrentes del equipo
        </h2>
        <p className="text-sm text-muted-foreground">
          Pagos e ingresos periódicos del equipo, gestionados por cualquier
          miembro. Cada uno tiene un pagador designado.
        </p>
      </header>

      <RecurringView teamId={id} />
    </div>
  );
}
