import { Producto } from '@/types'
import { calcularPrecioConDescuento } from '@/lib/descuentos'

export type CatalogType = 'detal' | 'mayoreo'

/** Monto mínimo de compra para el catálogo mayorista (COP). */
export const MAYOREO_MIN_COMPRA = 200000

/** Monto de recompra mayorista (COP) — informado en la barra superior. */
export const MAYOREO_RECOMPRA = 100000

export function catalogBasePath(catalogType: CatalogType = 'detal'): string {
  return catalogType === 'mayoreo' ? '/mayorista' : ''
}

/** Ruta dentro del catálogo (detal o mayorista). */
export function catalogPath(catalogType: CatalogType, path: string): string {
  const base = catalogBasePath(catalogType)
  if (!path || path === '/') return base || '/'
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

export type ProductoPrecios = {
  precio: number | null
  precioAntes: number | null
  consultar: boolean
}

export function getProductoPrecios(
  producto: Producto,
  catalogType: CatalogType = 'detal',
): ProductoPrecios {
  let precio: number | null
  let precioAntes: number | null
  let consultar = false

  if (catalogType === 'mayoreo') {
    const p = producto.precio_mayoreo
    consultar = p == null || p === 0
    precio = consultar ? null : p
    precioAntes = consultar ? null : producto.precio_antes_mayoreo
  } else {
    precio = producto.precio
    precioAntes = producto.precio_antes
  }

  if (precio != null && !consultar) {
    const { precioFinal, tieneDescuento } = calcularPrecioConDescuento(
      precio,
      producto.categoria,
      catalogType,
    )
    if (tieneDescuento) {
      return {
        precio: precioFinal,
        precioAntes: precio,
        consultar: false,
      }
    }
  }

  return { precio, precioAntes, consultar }
}

/**
 * Precio al detal mostrado solo de forma informativa dentro del catálogo
 * mayorista (referencia de reventa). No afecta el carrito ni el checkout.
 */
export function getPrecioDetalInfo(producto: Producto): number | null {
  const p = producto.precio
  if (p == null || p <= 0) return null
  const { precioFinal } = calcularPrecioConDescuento(p, producto.categoria, 'detal')
  return precioFinal
}

/** Valor numérico para ordenar por precio (mayorista sin precio va al final). */
export function getPrecioOrden(producto: Producto, catalogType: CatalogType): number {
  const { precio, consultar } = getProductoPrecios(producto, catalogType)
  if (consultar || precio == null) return Number.POSITIVE_INFINITY
  return precio
}

export function getDescuentoPorcentaje(
  precio: number,
  precioAntes: number | null,
): number | null {
  if (!precioAntes || precioAntes <= precio) return null
  return Math.round((1 - precio / precioAntes) * 100)
}
