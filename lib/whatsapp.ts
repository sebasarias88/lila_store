import { ItemCarrito, DatosCliente } from '@/types'
import { formatVariacionesResumen } from '@/lib/cart'
import type { CatalogType } from '@/lib/catalog'
import { getItemPrecios } from '@/lib/variaciones'
import { documentShort, type CreatedOrder } from '@/lib/orders/shared'

export type WhatsAppConsultaContext = 'flotante' | 'nosotros' | 'footer'

export type WhatsAppRecargoPago = {
  labelLinea: string
  monto: number
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

/** Mensaje prellenado según dónde se abre el chat (consulta, no pedido). */
export function mensajeConsultaWhatsApp(
  context: WhatsAppConsultaContext,
  catalogType: CatalogType = 'detal',
): string {
  const esMayorista = catalogType === 'mayoreo'

  if (context === 'nosotros') {
    return esMayorista
      ? 'Hola, vengo del catálogo mayorista de Lila-store y me gustaría hacer una consulta.'
      : 'Hola, vengo del sitio de Lila-store y me gustaría hacer una consulta.'
  }

  if (context === 'footer') {
    return esMayorista
      ? 'Hola, me comunico desde el catálogo mayorista de Lila-store.'
      : 'Hola, me comunico desde el sitio de Lila-store.'
  }

  // flotante
  return esMayorista
    ? 'Hola, me gustaría consultar sobre el catálogo mayorista.'
    : 'Hola, me gustaría hacer una consulta sobre los productos.'
}

/** URL wa.me con texto prellenado. */
export function buildWhatsAppUrl(numero: string, mensaje: string): string {
  const digits = numero.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`
}

function precioUnitarioItem(
  item: ItemCarrito,
  catalogType: CatalogType,
): number | null {
  const { precio, consultar } = getItemPrecios(item, catalogType)
  if (consultar || precio == null) return null
  return precio
}

export function generarMensajeWhatsApp(
  items: ItemCarrito[],
  cliente: DatosCliente,
  costoEnvio: number,
  tiempoEntrega: string,
  catalogType: CatalogType = 'detal',
  recargoPago: WhatsAppRecargoPago | null = null,
  comprobanteUrl: string | null = null,
  /** Saved order: its number and the amounts the SERVER calculated win. */
  pedido: (CreatedOrder & { paidOnline?: boolean }) | null = null,
): string {
  const subtotalLocal = items.reduce((acc, item) => {
    const unitario = precioUnitarioItem(item, catalogType)
    if (unitario == null) return acc
    return acc + unitario * item.cantidad
  }, 0)

  const esRecogida = cliente.tipoEntrega === 'recogida'
  const subtotal = pedido ? pedido.subtotal : subtotalLocal
  const envioServidor = pedido ? pedido.shippingCost : null
  const envio = esRecogida ? 0 : pedido ? (envioServidor ?? 0) : costoEnvio
  const recargoMonto = pedido ? pedido.surcharge : (recargoPago?.monto ?? 0)
  const recargoLabel = pedido ? pedido.surchargeLabel : (recargoPago?.labelLinea ?? null)
  const total = pedido ? pedido.total : subtotal + envio + recargoMonto

  const productosLineas = items
    .map((item, index) => {
      const { precio, precioAntes, consultar } = getItemPrecios(
        item,
        catalogType,
      )
      const lineaServidor = pedido?.lines[index]
      const unitario = lineaServidor
        ? lineaServidor.unitPrice
        : consultar || precio == null
          ? null
          : precio
      const linea =
        unitario != null
          ? formatPrecio(unitario * item.cantidad)
          : 'Consultar precio'
      const tachado =
        unitario != null &&
        precioAntes != null &&
        precioAntes > unitario
          ? ` ~~${formatPrecio(precioAntes * item.cantidad)}~~`
          : ''
      // Each cart line holds ONE option per type, so the owner reads exactly
      // what the customer picked (e.g. "Color: Rojo"), each on its own line.
      const vars = formatVariacionesResumen(item.variacionesSeleccionadas)
      const detalles = [
        vars ? `   ↳ ${vars}` : '',
        item.producto.sku ? `   ↳ Ref: ${item.producto.sku}` : '',
      ].filter(Boolean)
      return [
        `${index + 1}. *${item.producto.nombre}* × ${item.cantidad} — ${linea}${tachado}`,
        ...detalles,
      ].join('\n')
    })
    .join('\n\n')

  const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0)

  const envioTexto = esRecogida
    ? 'Sin envío (recogida en tienda)'
    : pedido
      ? envioServidor == null
        ? 'A convenir'
        : envioServidor === 0
          ? 'Gratis'
          : formatPrecio(envioServidor)
      : costoEnvio === 0
        ? 'A convenir'
        : formatPrecio(costoEnvio)

  const bloqueEntrega = esRecogida
    ? `🏪 *Entrega:* Recoger en tienda
📍 *Sucursal:* ${cliente.sucursalRecogida}`
    : `📍 *Dirección:* ${cliente.direccion}
🏙️ *Ciudad:* ${cliente.ciudad}`

  const encabezadoMayoreo =
    catalogType === 'mayoreo' ? '📦 *Pedido Mayorista*\n\n' : ''

  const lineaRecargo =
    recargoLabel && recargoMonto > 0
      ? `${recargoLabel}: +${formatPrecio(recargoMonto)}\n`
      : ''

  const lineaDocumento = cliente.numeroDocumento
    ? `\nDocumento: ${documentShort(cliente.tipoDocumento)} ${cliente.numeroDocumento.trim()}`
    : ''
  const lineaFactura =
    cliente.quiereFactura === 'si'
      ? `\n🧾 *Factura electrónica:* Sí → ${cliente.facturaCorreo.trim()}${
          cliente.facturaOtroTitular === 'si'
            ? `\n   A nombre de: ${cliente.facturaNombre.trim()} (${documentShort(cliente.facturaTipoDocumento)} ${cliente.facturaNumeroDocumento.trim()})`
            : ''
        }`
      : ''
  const encabezadoPedido = pedido
    ? `🧾 *Pedido ${pedido.code}*${pedido.paidOnline ? '\n✅ *PAGADO en línea con Wompi*' : ''}\n`
    : ''
  const notaPrecios = pedido?.hasUnpricedItems
    ? '\n_Hay productos con precio por confirmar: te lo confirmamos por aquí._'
    : ''

  const mensaje = `${encabezadoMayoreo}✨ *Nuevo Pedido — Lila-store*
${encabezadoPedido}
👤 *Datos del cliente*
Nombre: ${cliente.nombre}
Celular: ${cliente.celular}${lineaDocumento}
${bloqueEntrega}${lineaFactura}

💳 *Método de pago:* ${cliente.metodoPago}${cliente.notas ? `\n📝 *Notas:* ${cliente.notas}` : ''}${comprobanteUrl ? `\n📎 *Comprobante:* ${comprobanteUrl}` : ''}${cliente.aceptaPoliticas === 'si' ? `\n✅ Aceptó términos y tratamiento de datos (${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })})` : ''}

🛍️ *Productos* (${totalUnidades} ${totalUnidades === 1 ? 'unidad' : 'unidades'})
${productosLineas}

📦 *Resumen*
Subtotal: ${formatPrecio(subtotal)}
Envío: ${envioTexto}
${lineaRecargo}⏱️ Entrega: ${esRecogida ? 'Recoger en tienda' : (pedido?.shippingLabel || tiempoEntrega)}

*TOTAL: ${formatPrecio(total)}* 💰${notaPrecios}

_Pedido generado desde el catálogo de Lila-store_`

  return encodeURIComponent(mensaje)
}

/** Href wa.me (mensaje ya debe venir encodeURIComponent). */
export function buildWhatsAppPedidoHref(
  mensajeEncoded: string,
  numero: string,
): string {
  const digits = numero.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${mensajeEncoded}`
}

/**
 * Abre una pestaña en el mismo gesto del usuario (antes de cualquier await).
 * Luego se navega a wa.me cuando el pedido ya está listo.
 */
export function reservarVentanaWhatsApp(): Window | null {
  if (typeof window === 'undefined') return null
  try {
    const w = window.open('about:blank', '_blank')
    if (w) {
      try {
        w.document.write(
          '<!doctype html><title>WhatsApp…</title><body style="font-family:system-ui;padding:2rem;color:#6E4FA8">Abriendo WhatsApp…</body>',
        )
        w.document.close()
      } catch {
        /* ignore opaque / restricted docs */
      }
    }
    return w
  } catch {
    return null
  }
}

export function cerrarVentanaReservada(w: Window | null | undefined): void {
  if (!w || w.closed) return
  try {
    w.close()
  } catch {
    /* ignore */
  }
}

/**
 * Abre WhatsApp.
 * Preferir `ventanaReservada` creada en el click (mobile-safe tras awaits).
 */
export function abrirWhatsApp(
  mensajeEncoded: string,
  numero: string,
  ventanaReservada?: Window | null,
): void {
  const href = buildWhatsAppPedidoHref(mensajeEncoded, numero)

  if (ventanaReservada && !ventanaReservada.closed) {
    try {
      ventanaReservada.location.href = href
      return
    } catch {
      cerrarVentanaReservada(ventanaReservada)
    }
  }

  // Same-tab en touch: no lo bloquea el popup blocker (a diferencia de target=_blank)
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isTouch) {
    window.location.assign(href)
    return
  }

  const opened = window.open(href, '_blank', 'noopener,noreferrer')
  if (opened) return

  const a = document.createElement('a')
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
