import Link from "next/link";
import { Plus } from "lucide-react";
import { TeamsView } from "@/components/teams/TeamsView";
import { Button } from "@/components/ui/Button";

export default function TeamsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
          <p className="text-sm text-muted-foreground">
            Crea equipos y comparte tus finanzas.
          </p>
        </div>
        <Link href="/teams/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo equipo</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </Link>
      </header>

      <TeamsView />
    </div>
  );
}
