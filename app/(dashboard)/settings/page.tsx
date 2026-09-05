import Link from "next/link";
import { FileText, Landmark, Scale, Cookie } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configura tu perfil y preferencias.
        </p>
      </header>

      <SettingsForm />

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-card-foreground">
                Conexión bancaria
              </h2>
              <p className="text-sm text-muted-foreground">
                Importa automáticamente los movimientos de tu banco.
              </p>
            </div>
          </div>
          <Link href="/bank">
            <Button>Gestionar</Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Documentación legal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Información sobre el tratamiento de datos y las condiciones de uso
          del servicio.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/privacy"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Política de Privacidad
          </Link>
          <Link
            href="/terms"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Scale className="h-4 w-4 text-muted-foreground" />
            Términos de Uso
          </Link>
          <Link
            href="/cookies"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Cookie className="h-4 w-4 text-muted-foreground" />
            Política de Cookies
          </Link>
        </div>
      </Card>
    </div>
  );
}
