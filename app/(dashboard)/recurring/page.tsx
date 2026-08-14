import { RecurringView } from "@/components/recurring/RecurringView";

export default function RecurringPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Recurrentes</h1>
        <p className="text-sm text-muted-foreground">
          Pagos e ingresos periódicos que se aplican automáticamente al abrir
          la app, en tu área personal y en los equipos que elijas.
        </p>
      </header>

      <RecurringView />
    </div>
  );
}
