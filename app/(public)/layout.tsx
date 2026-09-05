import Link from "next/link";
import { Wallet, Mail } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold leading-tight">
              SolbytLLC EM
            </span>
            <span className="text-xs text-muted-foreground">
              Controla tus gastos y compártelos con tu equipo
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Términos
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <a
              href="mailto:info@solbyt.tech"
              className="hover:text-foreground"
            >
              info@solbyt.tech
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} Solbyt LLC. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}