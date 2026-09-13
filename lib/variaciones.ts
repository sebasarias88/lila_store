import { ItemCarrito, Producto, VariacionOpcion, VariacionTipo } from '@/types'
import {
  getProductoPrecios,
  type CatalogType,
  type ProductoPrecios,
} from '@/lib/catalog'

/** Solo tipos con al menos una opción disponible, ordenados. */
export function normalizarVariacionesProducto(
  tipos: VariacionTipo[] | null | undefined,
): VariacionTipo[] {
  if (!tipos?.length) return []

  return tipos
    .map(tipo => ({
      ...tipo,
      opciones: [...(tipo.opciones || [])]
        .filter(o => o.disponible)
        .sort((a, b) => a.orden - b.orden),
    }))
    .filter(tipo => (tipo.opciones?.length ?? 0) > 0)
    .sort((a, b) => a.orden - b.orden)
}

export function buildVariacionesSeleccionadas(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): Record<string, string> | undefined {
  const result: Record<string, string> = {}

  for (const tipo of variaciones) {
    const opcionIds = selectedByTipoId[tipo.id]
    if (!opcionIds?.length) continue
    // Se respeta el orden de las opciones del tipo para una clave estable.
    const nombres = (tipo.opciones || [])
      .filter(o => opcionIds.includes(o.id))
      .map(o => o.nombre)
    if (nombres.length) result[tipo.nombre] = nombres.join(', ')
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/** Última opción seleccionada (por tipo) que tenga foto. */
export function imagenUrlVariacionActiva(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): string | null {
  let found: string | null = null

  for (const tipo of variaciones) {
    const opcionIds = selectedByTipoId[tipo.id]
    if (!opcionIds?.length) continue

    for (let i = opcionIds.length - 1; i >= 0; i--) {
      const opcion = (tipo.opciones || []).find(o => o.id === opcionIds[i])
      const url = opcion?.imagen_url?.trim()
      if (url) {
        found = url
        break
      }
    }
  }

  return found
}

export type VariacionPrecioOverride = {
  precio: number | null
  precio_antes: number | null
  precio_mayoreo: number | null
  precio_antes_mayoreo: number | null
}

function opcionTienePrecioPropio(opcion: VariacionOpcion): boolean {
  return (
    opcion.precio != null ||
    opcion.precio_antes != null ||
    opcion.precio_mayoreo != null ||
    opcion.precio_antes_mayoreo != null
  )
}

/**
 * Snapshot de precios de la opción elegida.
 * Si hay varias opciones con precio (varios tipos), gana la del tipo con mayor `orden`.
 */
export function buildVariacionPrecioOverride(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): VariacionPrecioOverride | null {
  let found: VariacionPrecioOverride | null = null

  const tipos = [...variaciones].sort((a, b) => a.orden - b.orden)
  for (const tipo of tipos) {
    const opcionIds = selectedByTipoId[tipo.id] ?? []
    for (const opcionId of opcionIds) {
      const opcion = (tipo.opciones || []).find(o => o.id === opcionId)
      if (!opcion || !opcionTienePrecioPropio(opcion)) continue
      found = {
        precio: opcion.precio ?? null,
        precio_antes: opcion.precio_antes ?? null,
        precio_mayoreo: opcion.precio_mayoreo ?? null,
        precio_antes_mayoreo: opcion.precio_antes_mayoreo ?? null,
      }
    }
  }

  return found
}

/** Producto con precios de variante aplicados (antes del descuento de categoría). */
export function productoConPrecioVariacion(
  producto: Producto,
  override?: VariacionPrecioOverride | null,
): Producto {
  if (!override) return producto

  const precioDetal =
    override.precio != null ? override.precio : producto.precio
  const precioAntesDetal =
    override.precio != null
      ? override.precio_antes
      : producto.precio_antes

  const precioMayoreo =
    override.precio_mayoreo != null
      ? override.precio_mayoreo
      : producto.precio_mayoreo
  const precioAntesMayoreo =
    override.precio_mayoreo != null
      ? override.precio_antes_mayoreo
      : producto.precio_antes_mayoreo

  return {
    ...producto,
    precio: precioDetal,
    precio_antes: precioAntesDetal,
    precio_mayoreo: precioMayoreo,
    precio_antes_mayoreo: precioAntesMayoreo,
  }
}

export function getPreciosConVariacion(
  producto: Producto,
  catalogType: CatalogType,
  override?: VariacionPrecioOverride | null,
): ProductoPrecios {
  return getProductoPrecios(
    productoConPrecioVariacion(producto, override),
    catalogType,
  )
}

export function getItemPrecios(
  item: ItemCarrito,
  catalogType: CatalogType = 'detal',
): ProductoPrecios {
  return getPreciosConVariacion(
    item.producto,
    catalogType,
    item.variacionPrecioOverride,
  )
}

/** Precio de lista corto para chips de opción en PDP (sin descuento de categoría). */
export function precioOpcionLabel(
  opcion: VariacionOpcion,
  catalogType: CatalogType,
): number | null {
  if (catalogType === 'mayoreo') {
    return opcion.precio_mayoreo != null && opcion.precio_mayoreo > 0
      ? opcion.precio_mayoreo
      : null
  }
  return opcion.precio != null && opcion.precio > 0 ? opcion.precio : null
}
