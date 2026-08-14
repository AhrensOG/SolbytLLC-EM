import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card } from "@/components/ui/Card";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Nueva transacción</h1>
        <p className="text-sm text-muted-foreground">
          Registra un ingreso o un gasto.
        </p>
      </header>

      <Card className="p-6">
        <TransactionForm />
      </Card>
    </div>
  );
}
