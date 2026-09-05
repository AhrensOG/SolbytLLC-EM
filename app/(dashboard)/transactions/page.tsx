import { TransactionsView } from "@/components/transactions/TransactionsView";
import { NewTransactionButton } from "@/components/transactions/NewTransactionButton";

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
        <NewTransactionButton />
      </header>

      <TransactionsView />
    </div>
  );
}