import { BankView } from "@/components/bank/BankView";

export default function BankPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Banco</h1>
        <p className="text-sm text-muted-foreground">
          Conecta tu cuenta bancaria para importar tus movimientos sin
          escribirlos a mano.
        </p>
      </header>

      <BankView />
    </div>
  );
}