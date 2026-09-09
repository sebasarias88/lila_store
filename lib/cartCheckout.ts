import type { ItemCarrito } from '@/types'
import { supabase } from '@/lib/supabase'

/** Productos del carrito que tienen al menos un tipo de variación en DB. */
export async function getProductIdsWithVariaciones(
  productIds: string[],
): Promise<Set<string>> {
  const unique = [...new Set(productIds.filter(Boolean))]
  if (unique.length === 0) return new Set()

  const { data, error } = await supabase
    .from('variacion_tipos')
    .select('producto_id')
    .in('producto_id', unique)

  if (error) {
    console.error('[getProductIdsWithVariaciones]', error)
    return new Set()
  }

  return new Set((data || []).map((r: { producto_id: string }) => r.producto_id))
}

/**
 * Líneas del carrito que requieren variaciones pero no las tienen seleccionadas.
 * Usa el set precargado o el flag `producto.tiene_variaciones`.
 */
export function findItemsSinVariaciones(
  items: ItemCarrito[],
  productIdsWithVariaciones?: Set<string> | null,
): ItemCarrito[] {
  return items.filter(item => {
    const needs =
      productIdsWithVariaciones?.has(item.producto.id) ||
      Boolean(item.producto.tiene_variaciones)
    if (!needs) return false
    const vars = item.variacionesSeleccionadas
    return !vars || Object.keys(vars).length === 0
  })
}
