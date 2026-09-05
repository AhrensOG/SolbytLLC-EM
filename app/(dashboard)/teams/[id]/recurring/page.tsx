import { RecurringView } from "@/components/recurring/RecurringView";

export default async function TeamRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-foreground">
          Transacciones recurrentes del equipo
        </h2>
        <p className="text-sm text-muted-foreground">
          Transacciones periódicas del equipo, gestionadas por cualquier
          miembro. Cada una tiene un pagador designado.
        </p>
      </header>

      <RecurringView teamId={id} />
    </div>
  );
}