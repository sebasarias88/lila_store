import { ItemCarrito, DatosCliente } from '@/types'
import { formatVariacionesResumen } from '@/lib/cart'
import { getProductoPrecios, type CatalogType } from '@/lib/catalog'

export type WhatsAppConsultaContext = 'flotante' | 'nosotros' | 'footer'

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
      ? 'Hola, vengo del catálogo mayorista de Tienda VM Fashion y me gustaría hacer una consulta.'
      : 'Hola, vengo del sitio de Tienda VM Fashion y me gustaría hacer una consulta.'
  }

  if (context === 'footer') {
    return esMayorista
      ? 'Hola, me comunico desde el catálogo mayorista de Tienda VM Fashion.'
      : 'Hola, me comunico desde el sitio de Tienda VM Fashion.'
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
): string {
  const subtotal = items.reduce((acc, item) => {
    const unitario = precioUnitarioItem(item, catalogType)
    if (unitario == null) return acc
    return acc + unitario * item.cantidad
  }, 0)

  const total = subtotal + costoEnvio

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

  const envioTexto =
    costoEnvio === 0 ? 'A convenir' : formatPrecio(costoEnvio)

  const encabezadoMayoreo =
    catalogType === 'mayoreo' ? '📦 *Pedido Mayorista*\n\n' : ''

  const mensaje = `${encabezadoMayoreo}✨ *Nuevo Pedido — Tienda VM Fashion*

👤 *Datos del cliente*
Nombre: ${cliente.nombre}
Celular: ${cliente.celular}
Dirección: ${cliente.direccion}
Ciudad: ${cliente.ciudad}

💳 *Método de pago:* ${cliente.metodoPago}${cliente.notas ? `\n📝 *Notas:* ${cliente.notas}` : ''}

🛍️ *Productos*
${productosLineas}

📦 *Resumen*
Subtotal: ${formatPrecio(subtotal)}
Envío: ${envioTexto}
⏱️ Entrega: ${tiempoEntrega}

*TOTAL: ${formatPrecio(total)}* 💰

_Pedido generado desde el catálogo online_`

  return encodeURIComponent(mensaje)
}

export function abrirWhatsApp(mensaje: string, numero: string): void {
  window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
}
