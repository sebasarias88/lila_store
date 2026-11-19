import type { ItemCarrito, Producto } from '@/types'
import type { CatalogType } from '@/lib/catalog'

/**
 * The store no longer tracks inventory (owner's request, Nov 2026): whether a
 * product can be bought depends only on its visibility toggle. The stock
 * columns stay in the database but are ignored. This cap only limits how many
 * units of one product fit in a single order.
 */
export const MAX_UNITS_PER_PRODUCT = 50

/** Units of this product that can be ordered in this catalog (cap or 0 if hidden). */
export function getStockCatalogo(
  producto: Producto,
  catalogType: CatalogType = 'detal',
): number {
  return productoVisibleEnCatalogo(producto, catalogType) ? MAX_UNITS_PER_PRODUCT : 0
}

/** ¿El toggle de visibilidad del catálogo está activo? */
export function productoVisibleEnCatalogo(
  producto: Producto,
  catalogType: CatalogType,
): boolean {
  if (catalogType === 'mayoreo') {
    return Boolean(producto.disponible_mayoreo ?? producto.disponible)
  }
  return Boolean(producto.disponible_detal ?? producto.disponible)
}

/** Se puede comprar en este catálogo: depende solo del toggle de visibilidad. */
export function productoComprableEnCatalogo(
  producto: Producto,
  catalogType: CatalogType,
): boolean {
  return (
    productoVisibleEnCatalogo(producto, catalogType) &&
    getStockCatalogo(producto, catalogType) > 0
  )
}

/** Unidades del mismo producto en el carrito (todas las líneas / variaciones). */
export function cantidadProductoEnCarrito(
  items: ItemCarrito[],
  productoId: string,
): number {
  return items
    .filter(i => i.producto.id === productoId)
    .reduce((acc, i) => acc + i.cantidad, 0)
}

/** Cuántas unidades más se pueden agregar de este producto. */
export function stockRestanteParaProducto(
  producto: Producto,
  items: ItemCarrito[],
  catalogType: CatalogType,
  /** Si se actualiza una línea, excluir su cantidad actual del conteo. */
  excludeLineKey?: string,
): number {
  const stock = getStockCatalogo(producto, catalogType)
  const enCarrito = items.reduce((acc, i) => {
    if (i.producto.id !== producto.id) return acc
    const key = i.lineKey ?? i.producto.id
    if (excludeLineKey && key === excludeLineKey) return acc
    return acc + i.cantidad
  }, 0)
  return Math.max(0, stock - enCarrito)
}

export function mensajeStockRestante(restantes: number): string {
  if (restantes <= 0) {
    return `Máximo ${MAX_UNITS_PER_PRODUCT} unidades por pedido. Para más, escríbenos por WhatsApp.`
  }
  return ''
}

export type StockProductoFresh = Pick<
  Producto,
  | 'id'
  | 'nombre'
  | 'stock_detal'
  | 'stock_mayoreo'
  | 'disponible'
  | 'disponible_detal'
  | 'disponible_mayoreo'
>

/**
 * Valida el carrito contra stock fresco (p. ej. justo antes de WhatsApp).
 * Agrupa por producto_id porque el inventario es compartido entre variaciones.
 */
export function validarStockCarrito(
  items: ItemCarrito[],
  freshById: Record<string, StockProductoFresh>,
  catalogType: CatalogType,
): { ok: true } | { ok: false; message: string } {
  const qtyByProduct = new Map<string, number>()
  for (const item of items) {
    qtyByProduct.set(
      item.producto.id,
      (qtyByProduct.get(item.producto.id) ?? 0) + item.cantidad,
    )
  }

  for (const [productoId, qty] of qtyByProduct) {
    const fresh = freshById[productoId]
    if (!fresh) {
      return {
        ok: false,
        message: 'Un producto de tu carrito ya no está disponible. Actualiza e intenta de nuevo.',
      }
    }
    const asProducto = fresh as Producto
    if (!productoComprableEnCatalogo(asProducto, catalogType)) {
      return {
        ok: false,
        message: `${fresh.nombre} ya no está disponible. Quítalo del carrito para continuar.`,
      }
    }
    const stock = getStockCatalogo(asProducto, catalogType)
    if (qty > stock) {
      return {
        ok: false,
        message: `${fresh.nombre}: ${mensajeStockRestante(0)}`,
      }
    }
  }

  return { ok: true }
}
