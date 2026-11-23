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

/** Max cart lines one "add" can create (e.g. 3 colours × 4 sizes = 12). */
export const MAX_VARIATION_COMBINATIONS = 12

/** One cart line: exactly one option per variation type. */
export type VariationCombination = {
  /** tipo nombre → opción nombre (one option each, never a joined list). */
  variacionesSeleccionadas: Record<string, string> | undefined
  /** Same shape as the page selection, with a single option per type. */
  selection: Record<string, string[]>
}

/**
 * The product page lets the customer tick several options of one type (e.g.
 * red AND blue). Each combination must become its own cart line so the
 * WhatsApp order says exactly what was chosen ("Color: Rojo × 1",
 * "Color: Azul × 1") instead of one ambiguous line ("Color: Rojo, Azul × 2").
 */
export function buildVariationCombinations(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): VariationCombination[] {
  const tipos = [...variaciones].sort((a, b) => a.orden - b.orden)
  let combos: Record<string, string[]>[] = [{}]

  for (const tipo of tipos) {
    const picked = selectedByTipoId[tipo.id] ?? []
    // Keep the type's own option order so lines are stable and readable.
    const opcionIds = (tipo.opciones || [])
      .filter(o => picked.includes(o.id))
      .map(o => o.id)
    if (!opcionIds.length) continue
    const next: Record<string, string[]>[] = []
    for (const combo of combos) {
      for (const opcionId of opcionIds) {
        next.push({ ...combo, [tipo.id]: [opcionId] })
      }
    }
    combos = next
  }

  return combos.map(selection => ({
    selection,
    variacionesSeleccionadas: buildVariacionesSeleccionadas(variaciones, selection),
  }))
}

/** How many cart lines the current selection would create (0 if nothing picked). */
export function countVariationCombinations(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): number {
  let total = 1
  let any = false
  for (const tipo of variaciones) {
    const n = (selectedByTipoId[tipo.id] ?? []).length
    if (!n) continue
    any = true
    total *= n
  }
  return any ? total : 0
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
