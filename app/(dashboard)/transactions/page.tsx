import Link from "next/link";
import { Plus } from "lucide-react";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { Button } from "@/components/ui/Button";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transacciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus ingresos y gastos.
          </p>
        </div>
        <Link href="/transactions/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva transacción</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </Link>
      </header>

      <TransactionsView />
    </div>
  );
}
