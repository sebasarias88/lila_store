import { ItemCarrito } from '@/types'
import { getProductoPrecios, type CatalogType } from '@/lib/catalog'

/** Clave única por producto + combinación de variaciones. */
export function getLineKey(
  productoId: string,
  variacionesSeleccionadas?: Record<string, string>,
): string {
  if (!variacionesSeleccionadas || !Object.keys(variacionesSeleccionadas).length) {
    return productoId
  }
  const sorted = Object.entries(variacionesSeleccionadas).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  return `${productoId}:${JSON.stringify(sorted)}`
}

export function itemLineKey(item: ItemCarrito): string {
  return item.lineKey ?? getLineKey(item.producto.id, item.variacionesSeleccionadas)
}

export function formatVariacionesResumen(
  variaciones?: Record<string, string>,
): string {
  if (!variaciones || !Object.keys(variaciones).length) return ''
  return Object.entries(variaciones)
    .map(([tipo, opcion]) => `${tipo}: ${opcion}`)
    .join(' · ')
}

/** Clases para la línea de variaciones en carrito / drawer. */
export const variacionesCarritoClassName = 'text-[10px] leading-snug text-[var(--text-subtle)]'

export function itemLineTotal(
  item: ItemCarrito,
  catalogType: CatalogType = 'detal',
): number | null {
  const { precio, consultar } = getProductoPrecios(item.producto, catalogType)
  if (consultar || precio == null) return null
  return precio * item.cantidad
}

export function cartSubtotal(
  items: ItemCarrito[],
  catalogType: CatalogType = 'detal',
): number {
  return items.reduce((acc, item) => {
    const line = itemLineTotal(item, catalogType)
    return line != null ? acc + line : acc
  }, 0)
}
