import { BankView } from "@/components/bank/BankView";

export default function BankPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Banco</h1>
        <p className="text-sm text-muted-foreground">
          Conecta y sincroniza tus cuentas bancarias para importar movimientos
          sin escribirlos a mano.
        </p>
      </header>

      <BankView />
    </div>
  );
}