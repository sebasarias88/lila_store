import { ItemCarrito, DatosCliente } from '@/types'
import { formatVariacionesResumen } from '@/lib/cart'
import { getProductoPrecios, type CatalogType } from '@/lib/catalog'

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
  const { precio, consultar } = getProductoPrecios(item.producto, catalogType)
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
): string {
  const subtotal = items.reduce((acc, item) => {
    const unitario = precioUnitarioItem(item, catalogType)
    if (unitario == null) return acc
    return acc + unitario * item.cantidad
  }, 0)

  const esRecogida = cliente.tipoEntrega === 'recogida'
  const envio = esRecogida ? 0 : costoEnvio
  const recargoMonto = recargoPago?.monto ?? 0
  const total = subtotal + envio + recargoMonto

  const productosLineas = items
    .map((item) => {
      const { precio, precioAntes, consultar } = getProductoPrecios(
        item.producto,
        catalogType,
      )
      const unitario =
        consultar || precio == null ? null : precio
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
      const vars = formatVariacionesResumen(item.variacionesSeleccionadas)
      const varsSuffix = vars ? ` | ${vars}` : ''
      return `▸ ${item.producto.nombre} × ${item.cantidad} — ${linea}${tachado}${varsSuffix}`
    })
    .join('\n')

  const envioTexto = esRecogida
    ? 'Sin envío (recogida en tienda)'
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
    recargoPago && recargoPago.monto > 0
      ? `${recargoPago.labelLinea}: +${formatPrecio(recargoPago.monto)}\n`
      : ''

  const mensaje = `${encabezadoMayoreo}✨ *Nuevo Pedido — Lila-store*

👤 *Datos del cliente*
Nombre: ${cliente.nombre}
Celular: ${cliente.celular}
${bloqueEntrega}

💳 *Método de pago:* ${cliente.metodoPago}${cliente.notas ? `\n📝 *Notas:* ${cliente.notas}` : ''}${comprobanteUrl ? `\n📎 *Comprobante:* ${comprobanteUrl}` : ''}

🛍️ *Productos*
${productosLineas}

📦 *Resumen*
Subtotal: ${formatPrecio(subtotal)}
Envío: ${envioTexto}
${lineaRecargo}⏱️ Entrega: ${esRecogida ? 'Recoger en tienda' : tiempoEntrega}

*TOTAL: ${formatPrecio(total)}* 💰

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
