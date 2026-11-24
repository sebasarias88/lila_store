import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { LEGAL_OWNER } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description:
    'Condiciones de compra en Lila Store: pedidos, precios, pagos, envíos, garantías, cambios, derecho de retracto y reversión del pago.',
  alternates: { canonical: '/terminos-y-condiciones' },
}

export default function TermsPage() {
  const o = LEGAL_OWNER
  return (
    <LegalPage
      title="Términos y condiciones"
      intro={
        <p>
          Estas condiciones aplican a las compras hechas en esta tienda virtual. Al enviar tu
          pedido aceptas estos términos y la{' '}
          <Link href="/politica-de-privacidad">política de tratamiento de datos personales</Link>.
          Se rigen por la ley colombiana, en especial la Ley 1480 de 2011 (Estatuto del
          Consumidor) y la Ley 527 de 1999 (comercio electrónico).
        </p>
      }
    >
      <section>
        <h2>1. Quién vende</h2>
        <ul>
          <li><strong>Vendedor:</strong> {o.name} ({o.personType}), nombre comercial {o.tradeName}</li>
          <li><strong>NIT:</strong> {o.nit}</li>
          <li><strong>Dirección:</strong> {o.address}, {o.city}</li>
          <li><strong>Correo:</strong> <a href={`mailto:${o.email}`}>{o.email}</a></li>
          <li><strong>Teléfono y WhatsApp:</strong> {o.phone}</li>
        </ul>
      </section>

      <section>
        <h2>2. Cómo funciona un pedido</h2>
        <ul>
          <li>Eliges los productos, llenas tus datos y envías el pedido desde el carrito. Tu pedido queda registrado con un número (por ejemplo LILA-1042) y se abre WhatsApp con el resumen para confirmarlo.</li>
          <li>Antes de enviarlo ves el resumen completo: productos, cantidades, precio total, costo de envío, recargos del medio de pago (si aplican) y tiempo estimado de entrega.</li>
          <li>El pedido queda confirmado cuando te respondemos por WhatsApp y verificamos el pago. Si un producto no está disponible, te avisamos y puedes cambiarlo o recibir la devolución de lo pagado por él.</li>
        </ul>
      </section>

      <section>
        <h2>3. Precios</h2>
        <ul>
          <li>Los precios están en pesos colombianos (COP) e incluyen los impuestos aplicables.</li>
          <li>El costo de envío se muestra aparte, antes de confirmar el pedido.</li>
          <li>Las promociones y descuentos son válidos mientras estén publicados o hasta la fecha que indique cada uno.</li>
          <li>Los precios del catálogo mayorista aplican solo a compras que cumplan el monto mínimo que se indica en ese catálogo.</li>
        </ul>
      </section>

      <section>
        <h2>4. Medios de pago</h2>
        <p>
          Puedes pagar con los medios que aparecen al finalizar la compra. Algunos medios de
          financiación pueden tener un recargo, que siempre se muestra antes de enviar el
          pedido. Si pagas por transferencia, puedes adjuntar el comprobante para agilizar la
          verificación.
        </p>
        <p>
          Si eliges <strong>pago en línea</strong>, el pago se hace en la página segura de Wompi
          (Grupo Bancolombia) con tarjeta, PSE, Nequi o Botón Bancolombia. Nosotros no vemos ni
          guardamos los datos de tu tarjeta o cuenta. Tu pedido queda confirmado cuando Wompi
          aprueba el pago.
        </p>
      </section>

      <section>
        <h2>5. Envíos y entregas</h2>
        <ul>
          <li>Enviamos a toda Colombia con empresas de mensajería aliadas. En Armenia también hacemos entregas locales.</li>
          <li>El tiempo de entrega que ves al comprar es un estimado según tu ciudad y la transportadora. Empieza a contar cuando el pago está verificado.</li>
          <li>También puedes recoger tu pedido en una de nuestras tiendas, sin costo de envío.</li>
          <li>Revisa el paquete al recibirlo. Si llega abierto o dañado, déjalo anotado con la transportadora y escríbenos ese mismo día con fotos.</li>
        </ul>
      </section>

      <section>
        <h2>6. Garantía</h2>
        <p>
          Todos los productos tienen la garantía legal de calidad, idoneidad y seguridad. Si un
          producto llega defectuoso, vencido o distinto a lo que pediste, escríbenos con fotos
          y lo cambiamos o te devolvemos el dinero, después de revisarlo. La garantía no cubre
          daños por mal uso, mala conservación o reacciones por no seguir las indicaciones del
          fabricante.
        </p>
      </section>

      <section>
        <h2>7. Cambios y productos que no se pueden devolver</h2>
        <p>
          Por higiene y salud, <strong>no aceptamos cambios ni devoluciones de productos
          cosméticos, de maquillaje, de cuidado capilar, facial o corporal que hayan sido
          abiertos o usados, o a los que se les haya quitado el sello de seguridad</strong>.
          Esto no afecta la garantía por defectos de fábrica.
        </p>
        <p>
          Los accesorios y productos sin abrir, en su empaque original y con su sello, se pueden
          cambiar escribiéndonos dentro de los 5 días hábiles siguientes a la entrega. El
          costo del envío del cambio lo asume quien lo solicita, salvo que el producto haya
          llegado defectuoso o equivocado.
        </p>
      </section>

      <section>
        <h2>8. Derecho de retracto</h2>
        <p>
          Como compraste a distancia, puedes retractarte de la compra dentro de los{' '}
          <strong>5 días hábiles</strong> siguientes a la entrega, escribiéndonos por WhatsApp o
          correo. Debes devolver el producto en el mismo estado en que lo recibiste: sin abrir,
          sin usar y con su empaque y sello originales. Los costos de transporte de la
          devolución corren por tu cuenta. Te devolvemos el dinero dentro de los 30 días
          calendario siguientes a tu solicitud.
        </p>
        <p>
          El retracto no aplica a los productos de uso personal que hayan sido abiertos o a los
          que se les haya retirado el sello, por las razones de higiene explicadas arriba.
        </p>
      </section>

      <section>
        <h2>9. Reversión del pago</h2>
        <p>
          Si pagaste con tarjeta de crédito, débito u otro medio de pago electrónico, puedes
          pedir la reversión del pago cuando fuiste víctima de fraude, la operación no fue
          solicitada, el producto no te llegó, o llegó defectuoso o distinto a lo que pediste.
          Debes avisarnos, y avisar a la entidad que emitió el medio de pago, dentro de los 5
          días hábiles siguientes a que te enteraste de la situación, y devolver el producto
          si lo recibiste.
        </p>
      </section>

      <section>
        <h2>10. Peticiones, quejas y reclamos</h2>
        <p>
          Escríbenos a <a href={`mailto:${o.email}`}>{o.email}</a> o por WhatsApp al {o.phone}.
          Respondemos en máximo 15 días hábiles. Si no quedas conforme, puedes acudir a la
          Superintendencia de Industria y Comercio (SIC).
        </p>
      </section>

      <section>
        <h2>11. Cambios a estos términos</h2>
        <p>
          Podemos actualizar estos términos. Cada pedido se rige por la versión publicada el
          día en que lo enviaste.
        </p>
      </section>
    </LegalPage>
  )
}
