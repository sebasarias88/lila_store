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
      ? 'Hola, vengo del catálogo mayorista de lila-store y me gustaría hacer una consulta.'
      : 'Hola, vengo del sitio de lila-store y me gustaría hacer una consulta.'
  }

  if (context === 'footer') {
    return esMayorista
      ? 'Hola, me comunico desde el catálogo mayorista de lila-store.'
      : 'Hola, me comunico desde el sitio de lila-store.'
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

  const mensaje = `${encabezadoMayoreo}✨ *Nuevo Pedido — lila-store*

👤 *Datos del cliente*
Nombre: ${cliente.nombre}
Celular: ${cliente.celular}
${bloqueEntrega}

💳 *Método de pago:* ${cliente.metodoPago}${cliente.notas ? `\n📝 *Notas:* ${cliente.notas}` : ''}

🛍️ *Productos*
${productosLineas}

📦 *Resumen*
Subtotal: ${formatPrecio(subtotal)}
Envío: ${envioTexto}
${lineaRecargo}⏱️ Entrega: ${esRecogida ? 'Recoger en tienda' : tiempoEntrega}

*TOTAL: ${formatPrecio(total)}* 💰

_Pedido generado desde el catálogo de lila-store_`

  return encodeURIComponent(mensaje)
}

export function abrirWhatsApp(mensaje: string, numero: string): void {
  window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
}
