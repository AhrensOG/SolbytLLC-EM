import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Términos de Uso | SolbytLLC EM",
  description:
    "Términos y condiciones de uso de SolbytLLC EM, la aplicación de registro y control de gastos personales y de equipo.",
};

const sections = [
  {
    title: "1. Identidad y objeto",
    body: [
      "Solbyt LLC (en adelante, «Solbyt», «nosotros» o «el titular») pone a disposición del usuario la aplicación SolbytLLC EM (en adelante, «la Aplicación»), una herramienta de registro, control y análisis de gastos e ingresos personales y compartidos entre equipos.",
      "Estos Términos de Uso regulan el acceso y la utilización de la Aplicación por parte del usuario. El uso de la Aplicación implica la aceptación plena de estos términos. Si el usuario no está de acuerdo con ellos, deberá abstenerse de utilizar la Aplicación.",
      "Para cualquier cuestión relativa a estos términos puede contactarnos en info@solbyt.tech.",
    ],
  },
  {
    title: "2. Registro y cuenta",
    body: [
      "El uso de la Aplicación requiere la creación de una cuenta con un nombre y una dirección de correo electrónico válida. El usuario se compromete a proporcionar datos veraces y a no suplantar la identidad de terceros.",
      "Cada dirección de correo electrónico puede asociarse a una sola cuenta. El usuario es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que se realicen con su cuenta.",
      "El usuario puede eliminar su cuenta en cualquier momento desde la sección «Ajustes». La eliminación conlleva el borrado de sus datos personales conforme a la Política de Privacidad.",
    ],
  },
  {
    title: "3. Uso del servicio",
    body: [
      "La Aplicación permite registrar transacciones, organizarlas por categorías, crear gastos recurrentes, definir metas y compartir determinada información con equipos de los que el usuario sea miembro.",
      "El usuario acepta utilizar la Aplicación exclusivamente con fines legítimos y de gestión financiera personal o de equipo. Queda prohibido: (i) el uso fraudulento o ilícito del servicio; (ii) la suplantación de identidad; (iii) la automatización abusiva o la extracción masiva de datos; (iv) el intento de acceder a cuentas ajenas o a sistemas del servicio sin autorización; y (v) cualquier uso que pueda dañar, sobrecargar o deteriorar la Aplicación.",
      "Solbyt se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos, sin perjuicio de las acciones legales que correspondan.",
    ],
  },
  {
    title: "4. Conexión bancaria y servicios de terceros",
    body: [
      "La Aplicación ofrece, de forma opcional, la conexión de cuentas bancarias a través de proveedores de servicios de información sobre cuentas autorizados y regulados (como Enable Banking), con el fin de importar automáticamente los movimientos que el usuario autorice.",
      "La conexión bancaria es un servicio de terceros: la autenticación se realiza en la web de la entidad bancaria del usuario y el acceso a los datos es de SOLO LECTURA, sin capacidad de iniciar pagos ni transferencias.",
      "El consentimiento para compartir los datos bancarios se presta por el propio usuario en el flujo habilitado a tal efecto y puede revocarse en cualquier momento, desde la Aplicación o desde la entidad bancaria.",
      "La Aplicación no es una entidad de pago ni un banco, y no ofrece servicios financieros regulados. Los movimientos que no provengan de la conexión bancaria deben ser introducidos manualmente por el usuario.",
    ],
  },
  {
    title: "5. Naturaleza informativa del servicio",
    body: [
      "La Aplicación es una herramienta de registro y visualización de información financiera. No constituye asesoramiento financiero, fiscal, contable ni de inversión, y no debe utilizarse como única base para tomar decisiones económicas.",
      "El usuario es responsable de la exactitud de los datos que introduce manualmente y de la revisión de los movimientos importados antes de su confirmación.",
    ],
  },
  {
    title: "6. Responsabilidad",
    body: [
      "La Aplicación se proporciona «tal cual» y según disponibilidad. Solbyt realiza esfuerzos razonables para mantener su correcto funcionamiento, pero no garantiza la ausencia de errores, interrupciones ni la disponibilidad ininterrumpida del servicio.",
      "Solbyt no será responsable de los daños derivados del mal funcionamiento de entidades bancarias o proveedores de terceros, de la pérdida de datos debida a causas ajenas a su control, ni del uso indebido del servicio por parte del usuario.",
      "Nada en estos términos limita los derechos que la legislación de protección de los consumidores y usuarios otorgue al usuario con carácter irrenunciable.",
    ],
  },
  {
    title: "7. Propiedad intelectual",
    body: [
      "La Aplicación, su diseño, código, marcas, logotipos y demás contenidos son titularidad de Solbyt o de sus licenciantes y están protegidos por la normativa de propiedad intelectual e industrial. El usuario no adquiere ningún derecho sobre ellos más allá del derecho de uso del servicio.",
      "El usuario conserva la titularidad de los datos que introduce en la Aplicación, otorgando a Solbyt una licencia limitada para su tratamiento con la finalidad de prestar el servicio, conforme a la Política de Privacidad.",
    ],
  },
  {
    title: "8. Modificación de los términos",
    body: [
      "Solbyt puede modificar estos términos para adaptarlos a cambios legales, funcionales u operativos. La versión vigente se publicará siempre en esta página con su fecha de actualización, y los cambios relevantes se notificarán a los usuarios a través de la Aplicación.",
    ],
  },
  {
    title: "9. Legislación aplicable y jurisdicción",
    body: [
      "Estos términos se rigen por el Derecho español. Para cualquier controversia derivada de su interpretación o ejecución, y sin perjuicio de los derechos que asisten al consumidor, serán competentes los juzgados y tribunales del domicilio del usuario si este reside en la Unión Europea; en caso contrario, los tribunales de la ciudad en la que Solbyt tenga su domicilio social.",
      "El usuario dispone de la plataforma de resolución de litigios en línea de la Comisión Europea (https://ec.europa.eu/consumers/odr), sin perjuicio de la posibilidad de acudir a la jurisdicción ordinaria.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Términos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 5 de septiembre de 2026
        </p>
      </header>

      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-relaxed text-foreground/80"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <p className="text-sm leading-relaxed text-muted-foreground">
          Si tienes dudas sobre estos términos, escríbenos a{" "}
          <a
            href="mailto:info@solbyt.tech"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            info@solbyt.tech
          </a>
          .
        </p>
      </Card>
    </div>
  );
}