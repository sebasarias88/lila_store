import type { ItemCarrito, Producto } from '@/types'
import type { CatalogType } from '@/lib/catalog'

/** Stock del producto para el catálogo actual. */
export function getStockCatalogo(
  producto: Producto,
  catalogType: CatalogType = 'detal',
): number {
  const raw =
    catalogType === 'mayoreo' ? producto.stock_mayoreo : producto.stock_detal
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) && n > 0 ? n : 0
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

/**
 * Se puede comprar en este catálogo: visible y con stock > 0.
 * Stock 0 ⇒ Agotado aunque el toggle esté activo.
 */
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
  if (restantes <= 0) return 'No hay unidades disponibles'
  if (restantes === 1) return 'Solo queda 1 unidad disponible'
  return `Solo quedan ${restantes} unidades disponibles`
}

/** Badge admin: verde >10, amarillo 1–10, rojo 0. */
export function stockBadgeTone(
  stock: number,
): 'ok' | 'low' | 'out' {
  if (stock <= 0) return 'out'
  if (stock <= 10) return 'low'
  return 'ok'
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
        message: `${fresh.nombre}: se agotó. Quítalo del carrito para continuar.`,
      }
    }
    const stock = getStockCatalogo(asProducto, catalogType)
    if (qty > stock) {
      return {
        ok: false,
        message: `${fresh.nombre}: ${mensajeStockRestante(stock)}. Ajusta la cantidad.`,
      }
    }
  }

  return { ok: true }
}
