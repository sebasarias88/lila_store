import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { LEGAL_OWNER } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Política de tratamiento de datos personales',
  description:
    'Cómo Lila Store recoge, usa y protege tus datos personales, y cómo ejercer tus derechos de hábeas data.',
  alternates: { canonical: '/politica-de-privacidad' },
}

export default function PrivacyPolicyPage() {
  const o = LEGAL_OWNER
  return (
    <LegalPage
      title="Política de tratamiento de datos personales"
      intro={
        <p>
          En {o.tradeName} cuidamos tus datos. Esta política explica qué información recogemos
          cuando compras o nos escribes, para qué la usamos y cómo puedes conocerla, corregirla o
          pedir que la eliminemos, de acuerdo con la Ley 1581 de 2012 y el Decreto 1074 de 2015
          (que compila el Decreto 1377 de 2013).
        </p>
      }
    >
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li><strong>Nombre:</strong> {o.name} ({o.personType}), nombre comercial {o.tradeName}</li>
          <li><strong>NIT:</strong> {o.nit}</li>
          <li><strong>Dirección:</strong> {o.address}, {o.city}</li>
          <li><strong>Correo:</strong> <a href={`mailto:${o.email}`}>{o.email}</a></li>
          <li><strong>Teléfono y WhatsApp:</strong> {o.phone}</li>
        </ul>
      </section>

      <section>
        <h2>2. Qué datos recogemos</h2>
        <ul>
          <li>Al hacer un pedido: nombre, teléfono, tipo y número de documento de identidad, ciudad, dirección de entrega (o la tienda donde recoges), notas del pedido, los productos que compras y el método de pago que eliges.</li>
          <li>Si pides factura electrónica: el correo donde quieres recibirla y, si la factura va a nombre de otra persona o empresa, su nombre o razón social y su documento o NIT.</li>
          <li>Si pagas en línea: la referencia y el estado del pago que nos informa la pasarela de pagos. Los datos de tu tarjeta o cuenta los recibe directamente la pasarela; nosotros nunca los vemos ni los guardamos.</li>
          <li>Si pagas por transferencia y adjuntas el comprobante: la imagen o PDF del comprobante.</li>
          <li>Cuando nos escribes por WhatsApp: tu número y lo que nos cuentas en la conversación.</li>
          <li>
            Datos técnicos mínimos para que la tienda funcione, como los productos de tu carrito
            guardados en tu propio navegador (ver la{' '}
            <Link href="/politica-de-cookies">política de cookies</Link>).
          </li>
        </ul>
        <p>No pedimos datos sensibles ni datos de tarjetas. Esta tienda no está dirigida a menores de edad.</p>
      </section>

      <section>
        <h2>3. Para qué usamos tus datos</h2>
        <ul>
          <li>Preparar, confirmar, cobrar y entregar tu pedido, y generar la guía de envío.</li>
          <li>Expedir la factura electrónica cuando la pides.</li>
          <li>Llevar el historial de pedidos de la tienda y escribirte por WhatsApp sobre el estado de tu pedido.</li>
          <li>Verificar los pagos por transferencia.</li>
          <li>Responder tus preguntas, solicitudes, quejas y reclamos.</li>
          <li>Atender garantías, cambios, retracto y reversión de pagos.</li>
          <li>Cumplir obligaciones legales, contables y tributarias.</li>
        </ul>
        <p>
          Solo te enviaremos promociones si nos das tu autorización por separado, y puedes
          retirarla en cualquier momento.
        </p>
      </section>

      <section>
        <h2>4. Autorización</h2>
        <p>
          Al marcar la casilla de autorización antes de enviar tu pedido, o al escribirnos por
          WhatsApp, autorizas el tratamiento de tus datos para las finalidades de esta política.
          Conservamos evidencia de esa autorización.
        </p>
      </section>

      <section>
        <h2>5. Con quién compartimos tus datos</h2>
        <p>No vendemos ni alquilamos tus datos. Solo los compartimos cuando hace falta para atender tu pedido:</p>
        <ul>
          <li>Empresas de mensajería o transportadoras, para entregarte el pedido.</li>
          <li>
            Proveedores tecnológicos que alojan la tienda y procesan información por nuestra
            cuenta (encargados): Supabase (base de datos y archivos, servidores en Canadá),
            Vercel (alojamiento web, servidores en Estados Unidos) y WhatsApp (Meta), por donde
            nos llega tu pedido. Esto implica una transmisión internacional de datos a países con
            niveles de protección adecuados, bajo contratos que exigen confidencialidad y
            seguridad.
          </li>
          <li>Autoridades, cuando una ley u orden judicial lo exija.</li>
        </ul>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>Como titular de los datos puedes:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber qué uso le hemos dado a tus datos.</li>
          <li>Revocar la autorización o pedir que eliminemos tus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
          <li>Acceder gratis a tus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de haber acudido primero a nosotros.</li>
        </ul>
      </section>

      <section>
        <h2>7. Cómo ejercer tus derechos</h2>
        <p>
          Escríbenos a <a href={`mailto:${o.email}`}>{o.email}</a> o por WhatsApp al {o.phone},
          con tu nombre, tu número de contacto y qué necesitas.
        </p>
        <ul>
          <li><strong>Consultas:</strong> respondemos en máximo 10 días hábiles (prorrogables 5 días hábiles más, avisándote el motivo).</li>
          <li><strong>Reclamos</strong> (corrección, actualización, eliminación o revocatoria): respondemos en máximo 15 días hábiles (prorrogables 8 días hábiles más, avisándote el motivo).</li>
        </ul>
      </section>

      <section>
        <h2>8. Cuánto tiempo guardamos tus datos y cómo los protegemos</h2>
        <p>
          Guardamos tus datos solo el tiempo necesario para las finalidades anteriores y para
          cumplir obligaciones legales, contables y tributarias. Los datos personales de los
          pedidos ya terminados (entregados o cancelados) se eliminan periódicamente, por lo
          general a más tardar a los 2 años, salvo que una ley nos obligue a conservarlos por más
          tiempo; de esos pedidos solo conservamos los productos y montos, sin datos que te
          identifiquen.
        </p>
        <p>
          Tus pedidos y comprobantes de pago se guardan en bases de datos y almacenamiento
          privados, protegidos con acceso restringido: solo la administración de la tienda puede
          verlos, ningún cliente puede ver los pedidos de otros y nunca se publican. Si llegara a
          presentarse un incidente de seguridad que afecte tus datos, te informaremos y lo
          reportaremos a la Superintendencia de Industria y Comercio como exige la ley.
        </p>
      </section>

      <section>
        <h2>9. Cambios a esta política</h2>
        <p>
          Si cambiamos esta política de forma importante, lo publicaremos en esta página con su
          nueva fecha. Esta versión rige desde la fecha de actualización indicada arriba.
        </p>
      </section>
    </LegalPage>
  )
}
