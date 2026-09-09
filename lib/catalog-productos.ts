import { createSupabasePublic } from '@/lib/supabase-public'
import {
  PRODUCTO_LIST_SELECT,
  mapListProductos,
} from '@/lib/productQueries'
import { productIdsMatchingSearch } from '@/lib/productSearch'
import { withProductoCategorias } from '@/lib/producto-categorias'
import type { CatalogType } from '@/lib/catalog'
import type { Categoria, Producto } from '@/types'

export const CATALOG_PAGE_SIZE = 24

export type CatalogOrden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre'

export type CatalogProductosPageResult = {
  productos: Producto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function disponibilidadField(catalogType: CatalogType): 'disponible_detal' | 'disponible_mayoreo' {
  return catalogType === 'mayoreo' ? 'disponible_mayoreo' : 'disponible_detal'
}

function precioField(catalogType: CatalogType): 'precio' | 'precio_mayoreo' {
  return catalogType === 'mayoreo' ? 'precio_mayoreo' : 'precio'
}

/** Resuelve slugs de categoría activa → IDs (raíz incluye subcategorías). */
export async function resolveCategoriaIds(
  categoriasRaiz: Categoria[],
  categoriaSlug: string,
): Promise<string[]> {
  if (!categoriaSlug.trim()) return []

  const slug = categoriaSlug.trim()
  const raiz = categoriasRaiz.find(r => r.slug === slug)
  if (raiz) {
    const ids = [raiz.id]
    for (const sub of raiz.subcategorias || []) {
      if (sub.activa !== false) ids.push(sub.id)
    }
    return ids
  }

  for (const r of categoriasRaiz) {
    const sub = r.subcategorias?.find(s => s.slug === slug)
    if (sub) return [sub.id]
  }

  // Fallback: buscar por slug en DB
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('categorias')
    .select('id, padre_id, subcategorias:categorias!padre_id(id, activa)')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return []
  const ids = [data.id as string]
  const subs = (data.subcategorias || []) as { id: string; activa?: boolean }[]
  for (const s of subs) {
    if (s.activa !== false) ids.push(s.id)
  }
  return ids
}

async function productIdsInCategorias(categoriaIds: string[]): Promise<string[] | null> {
  if (!categoriaIds.length) return null
  const supabase = createSupabasePublic()

  const [{ data: primary }, { data: junctions }] = await Promise.all([
    supabase.from('productos').select('id').in('categoria_id', categoriaIds),
    supabase
      .from('producto_categorias')
      .select('producto_id')
      .in('categoria_id', categoriaIds),
  ])

  const ids = new Set<string>()
  for (const row of primary || []) ids.add(row.id as string)
  for (const row of junctions || []) ids.add(row.producto_id as string)
  return [...ids]
}

export async function getCatalogProductosPage(opts: {
  catalogType: CatalogType
  page?: number
  pageSize?: number
  q?: string
  categoriaSlug?: string
  categoriasRaiz?: Categoria[]
  orden?: CatalogOrden
}): Promise<CatalogProductosPageResult> {
  const catalogType = opts.catalogType
  const pageSize = opts.pageSize ?? CATALOG_PAGE_SIZE
  const page = Math.max(1, opts.page ?? 1)
  const orden = opts.orden ?? 'relevancia'
  const disp = disponibilidadField(catalogType)
  const precioCol = precioField(catalogType)

  const supabase = createSupabasePublic()

  let idFilter: string[] | null = null

  const q = opts.q?.trim()
  if (q) {
    const searchIds = await productIdsMatchingSearch(q, catalogType)
    idFilter = searchIds
    if (idFilter.length === 0) {
      return { productos: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  const catSlug = opts.categoriaSlug?.trim()
  if (catSlug) {
    const catIds = await resolveCategoriaIds(opts.categoriasRaiz || [], catSlug)
    const catProductIds = await productIdsInCategorias(catIds)
    if (!catProductIds?.length) {
      return { productos: [], total: 0, page, pageSize, totalPages: 0 }
    }
    if (idFilter) {
      const set = new Set(catProductIds)
      idFilter = idFilter.filter(id => set.has(id))
      if (idFilter.length === 0) {
        return { productos: [], total: 0, page, pageSize, totalPages: 0 }
      }
    } else {
      idFilter = catProductIds
    }
  }

  let countQuery = supabase
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq(disp, true)

  let dataQuery = supabase
    .from('productos')
    .select(PRODUCTO_LIST_SELECT)
    .eq(disp, true)

  if (idFilter) {
    countQuery = countQuery.in('id', idFilter)
    dataQuery = dataQuery.in('id', idFilter)
  }

  switch (orden) {
    case 'precio-asc':
      dataQuery = dataQuery.order(precioCol, { ascending: true, nullsFirst: false })
      break
    case 'precio-desc':
      dataQuery = dataQuery.order(precioCol, { ascending: false, nullsFirst: false })
      break
    case 'nombre':
      dataQuery = dataQuery.order('nombre', { ascending: true })
      break
    default:
      dataQuery = dataQuery
        .order('orden', { ascending: true })
        .order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  dataQuery = dataQuery.range(from, to)

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery])

  if (error) {
    console.error('[getCatalogProductosPage]', error)
    return { productos: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count ?? 0
  const mapped = mapListProductos(data)
  const productos = withProductoCategorias(mapped)

  return {
    productos,
    total,
    page,
    pageSize,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
  }
}
