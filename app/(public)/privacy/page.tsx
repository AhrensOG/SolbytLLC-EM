import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Política de Privacidad | SolbytLLC EM",
  description:
    "Política de privacidad de SolbytLLC EM conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.",
};

const sections = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      "El responsable del tratamiento de los datos personales recogidos a través de la aplicación SolbytLLC EM (en adelante, «la Aplicación») es Solbyt LLC, con domicilio a efectos de notificaciones en Estados Unidos y contacto en info@solbyt.tech.",
      "Esta política se aplica a todos los usuarios de la Aplicación, independientemente de su país de residencia. Cuando el usuario reside en el Espacio Económico Europeo (EEE), el tratamiento se realiza de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).",
    ],
  },
  {
    title: "2. Datos que tratamos",
    body: [
      "Datos de cuenta: nombre, dirección de correo electrónico y moneda por defecto.",
      "Datos de uso del servicio: transacciones, categorías, objetivos, gastos recurrentes, equipos y membresías que el usuario registra voluntariamente en la Aplicación.",
      "Datos de conexión bancaria: cuando el usuario decide conectar una cuenta bancaria, tratamos exclusivamente la referencia de conexión y los movimientos que el propio usuario autoriza compartir a través de su entidad. La Aplicación NO recoge, almacena ni tiene acceso en ningún momento a las credenciales de acceso a la banca online (usuario y contraseña): la autenticación se realiza siempre en la web de la entidad bancaria o a través del proveedor de servicios de información sobre cuentas autorizado.",
      "Datos técnicos: fecha y hora de acceso, y cookies técnicas imprescindibles para el funcionamiento de la sesión (ver Política de Cookies).",
      "No tratamos categorías especiales de datos (art. 9 RGPD) ni datos relativos a condenas e infracciones penales.",
    ],
  },
  {
    title: "3. Finalidades y base jurídica",
    body: [
      "Prestación del servicio de registro y control de gastos, incluida la creación de la cuenta, la gestión de equipos y la generación de informes: base jurídica: ejecución del contrato (art. 6.1.b RGPD).",
      "Conexión opcional de cuentas bancarias para la importación automática de movimientos: base jurídica: consentimiento del interesado (art. 6.1.a RGPD), prestado al iniciar el flujo de conexión y revocable en cualquier momento desde la propia Aplicación o desde la entidad bancaria.",
      "Seguridad, prevención del fraude y buen funcionamiento técnico: base jurídica: interés legítimo (art. 6.1.f RGPD).",
      "El consentimiento es libre y su retirada no afecta a la licitud del tratamiento basado en él con anterioridad a su retirada (art. 7.3 RGPD).",
    ],
  },
  {
    title: "4. Destinatarios de los datos",
    body: [
      "Enable Banking, proveedor técnico de conectividad bancaria conforme a PSD2, como encargado del tratamiento en relación con la conexión bancaria y la obtención de movimientos. El acceso a los datos bancarios es de SOLO LECTURA: ningún proveedor puede iniciar pagos ni mover fondos con este acceso.",
      "Proveedores de infraestructura (alojamiento, base de datos y procesamiento de pagos si procede), que actúan como encargados del tratamiento bajo acuerdos de protección de datos.",
      "Autoridades públicas, cuando exista obligación legal.",
      "No vendemos, alquilamos ni cedemos datos personales a terceros con fines comerciales.",
    ],
  },
  {
    title: "5. Transferencias internacionales",
    body: [
      "Los datos pueden almacenarse en servidores ubicados en el EEE, el Reino Unido y Estados Unidos. El Reino Unido cuenta con una decisión de adecuación de la Comisión Europea que reconoce un nivel de protección equivalente. En el caso de Estados Unidos, el tratamiento se apoya en el Marco de Privacidad de Datos UE-EE.UU. o en las cláusulas contractuales tipo (art. 46 RGPD), garantizando en todo caso un nivel de protección adecuado.",
    ],
  },
  {
    title: "6. Conservación de los datos",
    body: [
      "Los datos personales se conservan mientras la cuenta del usuario esté activa. Cuando el usuario elimina su cuenta (opción disponible en Ajustes), todos sus datos personales y sus transacciones personales se suprimen de forma definitiva. Las transacciones compartidas en equipos se eliminan o desvinculan conforme a la funcionalidad descrita en los Términos de Uso.",
      "Sin perjuicio de lo anterior, podremos conservar determinados datos durante los plazos exigidos por la ley aplicable (por ejemplo, obligaciones fiscales o contables) o para la formulación, el ejercicio o la defensa de reclamaciones.",
    ],
  },
  {
    title: "7. Derechos de los usuarios",
    body: [
      "El usuario puede ejercer, en cualquier momento y de forma gratuita, los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad (arts. 15 a 20 RGPD), así como retirar el consentimiento prestado y oponerse a las decisiones basadas únicamente en el tratamiento automatizado.",
      "Para ejercer estos derechos, basta con escribir a info@solbyt.tech indicando el derecho que se desea ejercer, o utilizar las herramientas disponibles en la propia Aplicación (edición de perfil, eliminación de datos y eliminación de cuenta).",
      "El usuario tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) u otra autoridad de control competente si considera que el tratamiento no se ajusta a la normativa.",
    ],
  },
  {
    title: "8. Menores de edad",
    body: [
      "La Aplicación no está dirigida a menores de 14 años. En España, el tratamiento de datos de menores de 14 años requiere el consentimiento de sus padres o tutores (art. 7 LOPDGDD). Si tenemos conocimiento de que un menor ha creado una cuenta sin dicho consentimiento, procederemos a su eliminación.",
    ],
  },
  {
    title: "9. Seguridad",
    body: [
      "Aplicamos medidas técnicas y organizativas apropiadas para proteger los datos: cifrado en tránsito (TLS), control de acceso basado en sesiones autenticadas, y principio de minimización. La conexión bancaria se realiza exclusivamente a través de entidades reguladas, con acceso de solo lectura, revocable en cualquier momento por el usuario desde su entidad bancaria o desde la Aplicación.",
    ],
  },
  {
    title: "10. Cambios en esta política",
    body: [
      "Podemos actualizar esta Política de Privacidad para reflejar cambios legales o funcionales. Publicaremos la versión vigente en esta página con su fecha de actualización. Cuando los cambios sean relevantes, se notificará a los usuarios a través de la Aplicación.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 5 de septiembre de 2026
        </p>
      </header>

      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          En Solbyt LLC nos tomamos en serio la privacidad de tus datos. Esta
          política explica qué datos tratamos, para qué, con qué base jurídica
          y qué derechos te asisten, en cumplimiento del Reglamento (UE)
          2016/679 (RGPD) y de la Ley Orgánica 3/2018 (LOPDGDD).
        </p>
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
          Si tienes dudas sobre esta política o sobre el tratamiento de tus
          datos, escríbenos a{" "}
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