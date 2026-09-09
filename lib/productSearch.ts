import { createSupabasePublic } from '@/lib/supabase-public'
import type { CatalogType } from '@/lib/catalog'

/**
 * IDs de productos que coinciden con la búsqueda.
 * Intenta RPC unaccent; si no existe, fallback ilike en nombre/sku/marca.
 */
export async function productIdsMatchingSearch(
  query: string,
  catalogType: CatalogType = 'detal',
): Promise<string[]> {
  const q = query.trim()
  if (!q) return []

  const supabase = createSupabasePublic()
  const disp =
    catalogType === 'mayoreo' ? 'disponible_mayoreo' : 'disponible_detal'

  // RPC opcional: create function search_productos_unaccent(q text) ...
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'search_productos_unaccent',
    { search_query: q },
  )

  if (!rpcError && Array.isArray(rpcData)) {
    const ids = (rpcData as { id?: string }[])
      .map(r => r.id)
      .filter((id): id is string => Boolean(id))
    if (ids.length === 0) return []

    // Restringir a disponibles en el catálogo
    const { data: filtered } = await supabase
      .from('productos')
      .select('id')
      .eq(disp, true)
      .in('id', ids)

    return (filtered || []).map(r => r.id as string)
  }

  // Fallback: ilike (sin unaccent)
  const pattern = `%${q}%`
  const { data, error } = await supabase
    .from('productos')
    .select('id')
    .eq(disp, true)
    .or(`nombre.ilike.${pattern},sku.ilike.${pattern},marca.ilike.${pattern}`)

  if (error) {
    console.error('[productIdsMatchingSearch] fallback:', error)
    return []
  }

  return (data || []).map(r => r.id as string)
}
