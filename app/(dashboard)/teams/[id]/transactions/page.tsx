import { TeamTransactionsView } from "@/components/teams/TeamTransactionsView";
import { NewTeamTransactionButton } from "@/components/transactions/NewTeamTransactionButton";

export default async function TeamTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Transacciones</h2>
          <p className="text-sm text-muted-foreground">
            Ingresos y gastos compartidos del equipo.
          </p>
        </div>
        <NewTeamTransactionButton teamId={id} />
      </header>

      <TeamTransactionsView teamId={id} />
    </div>
  );
}