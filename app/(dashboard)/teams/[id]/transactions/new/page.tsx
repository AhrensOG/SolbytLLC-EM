import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card } from "@/components/ui/Card";

export default async function NewTeamTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <h2 className="text-xl font-bold text-foreground">Nuevo movimiento</h2>
        <p className="text-sm text-muted-foreground">
          Registra un ingreso o gasto en este equipo.
        </p>
      </header>

      <Card className="p-6">
        <TransactionForm teamId={id} />
      </Card>
    </div>
  );
}
