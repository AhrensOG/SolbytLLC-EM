import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Category, Currency, Transaction } from "@/lib/models";
import { serializeTransaction } from "@/lib/serialize";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card } from "@/components/ui/Card";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const transaction = await Transaction.findOne({
    where: { id, userId, teamId: null },
    include: [
      { model: Category, as: "category" },
      { model: Currency, as: "currency" },
    ],
  });

  if (!transaction) notFound();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">
          Editar transacción
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifica los datos de la transacción.
        </p>
      </header>

      <Card className="p-6">
        <TransactionForm transaction={serializeTransaction(transaction)} />
      </Card>
    </div>
  );
}
