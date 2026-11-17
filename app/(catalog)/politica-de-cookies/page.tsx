import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { LEGAL_OWNER } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Qué cookies y almacenamiento usa la tienda Lila Store y para qué.',
  alternates: { canonical: '/politica-de-cookies' },
}

export default function CookiePolicyPage() {
  const o = LEGAL_OWNER
  return (
    <LegalPage
      title="Política de cookies"
      intro={
        <p>
          Las cookies y el almacenamiento del navegador son pequeños archivos que una página
          guarda en tu dispositivo. En {o.tradeName} solo usamos los necesarios para que la
          tienda funcione. No usamos cookies de publicidad ni de seguimiento.
        </p>
      }
    >
      <section>
        <h2>1. Qué usamos y para qué</h2>
        <ul>
          <li><strong>Carrito de compras</strong> (almacenamiento local del navegador): recuerda los productos que agregas, aunque cierres la página.</li>
          <li><strong>Avisos ya vistos</strong> (almacenamiento local y de sesión): evita mostrarte varias veces el mismo anuncio o este aviso de cookies.</li>
          <li><strong>Sesión de administración</strong> (cookies): solo para la persona que administra la tienda, en el panel privado.</li>
        </ul>
        <p>
          Estos elementos son técnicos y necesarios: sin ellos el carrito no funcionaría. No los
          compartimos con terceros ni los usamos para crear perfiles.
        </p>
      </section>

      <section>
        <h2>2. Cómo borrarlas o bloquearlas</h2>
        <p>
          Puedes borrar o bloquear las cookies y el almacenamiento desde la configuración de tu
          navegador. Si lo haces, la tienda seguirá abierta, pero tu carrito podría vaciarse.
        </p>
      </section>

      <section>
        <h2>3. Cambios</h2>
        <p>
          Si en el futuro usamos herramientas de medición o publicidad, actualizaremos esta
          política y te pediremos tu consentimiento antes de activarlas.
        </p>
        <p>
          Para más información sobre tus datos, consulta la{' '}
          <Link href="/politica-de-privacidad">política de tratamiento de datos personales</Link>{' '}
          o escríbenos a <a href={`mailto:${o.email}`}>{o.email}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
