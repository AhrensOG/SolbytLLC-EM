import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Política de Cookies | SolbytLLC EM",
  description:
    "Política de cookies de SolbytLLC EM conforme a la Ley 34/2002 (LSSI) y el RGPD.",
};

export default function CookiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Política de Cookies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 5 de septiembre de 2026
        </p>
      </header>

      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">1. ¿Qué son las cookies?</h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            Las cookies son pequeños archivos de texto que el navegador
            almacena en el dispositivo del usuario al visitar un sitio web y
            que permiten recordar información entre visitas. Esta política se
            aplica a la aplicación SolbytLLC EM y a su sitio web de
            información.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">2. Cookies que utilizamos</h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            La Aplicación NO utiliza cookies publicitarias, de seguimiento ni
            de analítica de terceros. Únicamente utiliza una cookie técnica de
            sesión, imprescindible para que el usuario pueda iniciar sesión y
            utilizar el servicio de forma segura. Esta cookie se elimina al
            cerrar la sesión o al finalizar la sesión del navegador.
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Dado que se trata de una cookie estrictamente necesaria para el
            funcionamiento del servicio, su instalación está exenta del deber
            de consentimiento conforme al artículo 22.2 de la Ley 34/2002
            (LSSI) y no requiere un aviso previo de aceptación.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">3. ¿Cómo desactivar las cookies?</h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            El usuario puede configurar su navegador para bloquear o eliminar
            las cookies. No obstante, al ser la cookie de sesión necesaria
            para la autenticación, su bloqueo impedirá el acceso a la cuenta.
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Puede consultar cómo gestionar las cookies en los siguientes
            enlaces:{" "}
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Chrome
            </a>
            ,{" "}
            <a
              href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Firefox
            </a>
            ,{" "}
            <a
              href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Safari
            </a>{" "}
            y{" "}
            <a
              href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-639d0546-e34b-4ec0-8087-9bdbb5f7b5cb"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Edge
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">4. Más información</h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            Para cualquier duda sobre esta política, puedes escribirnos a{" "}
            <a
              href="mailto:info@solbyt.tech"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              info@solbyt.tech
            </a>
            . Para información sobre el tratamiento de datos personales,
            consulta la{" "}
            <a
              href="/privacy"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Política de Privacidad
            </a>
            .
          </p>
        </section>
      </Card>
    </div>
  );
}