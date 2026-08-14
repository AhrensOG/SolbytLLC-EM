import Link from "next/link";
import { Plus } from "lucide-react";
import { TeamTransactionsView } from "@/components/teams/TeamTransactionsView";
import { Button } from "@/components/ui/Button";

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
          <h2 className="text-xl font-bold text-foreground">Movimientos</h2>
          <p className="text-sm text-muted-foreground">
            Ingresos y gastos compartidos del equipo.
          </p>
        </div>
        <Link href={`/teams/${id}/transactions/new`}>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo movimiento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </Link>
      </header>

      <TeamTransactionsView teamId={id} />
    </div>
  );
}
