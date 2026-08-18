import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProductosClient from '@/components/catalog/ProductosClient'
import { buildMetadata } from '@/lib/seo'
import { catalogPath } from '@/lib/catalog'
import { getSiteConfig, getSiteName } from '@/lib/site-config'
import { withProductoCategorias } from '@/lib/producto-categorias'
import type { Categoria, Producto } from '@/types'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}): Promise<Metadata> {
  const { q, categoria } = await searchParams
  const config = await getSiteConfig()
  const siteName = getSiteName(config)
  const query = q?.trim()
  const categorySlug = categoria?.trim()
  const hasFilters = Boolean(query || categorySlug)
  const basePath = catalogPath('mayoreo', '/productos')

  let title = 'Catálogo mayorista'
  let description = `Productos de belleza mayoristas en ${siteName}.`
  let path = basePath

  if (query) {
    title = `Mayorista: "${query}"`
    description = `Resultados mayoristas para "${query}" en ${siteName}.`
    path = `${basePath}?q=${encodeURIComponent(query)}`
  } else if (categorySlug) {
    title = 'Mayorista por categoría'
    description = `Productos mayoristas filtrados por categoría en ${siteName}.`
    path = `${basePath}?categoria=${encodeURIComponent(categorySlug)}`
  }

  return buildMetadata({
    config,
    title,
    description,
    path,
    noIndex: hasFilters,
  })
}

export default async function MayoreoProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}) {
  const { q, categoria } = await searchParams

  let categorias: Categoria[] = []
  let productos: (Producto & { producto_categorias?: { categoria_id?: string; categoria?: Categoria | null }[] })[] = []

  try {
    const supabase = await createSupabaseServer()
    const [cat, prod] = await Promise.all([
      supabase
        .from('categorias')
        .select('*, subcategorias:categorias!padre_id(*)')
        .is('padre_id', null)
        .eq('activa', true)
        .order('orden')
        .order('orden', { referencedTable: 'subcategorias' }),
      supabase
        .from('productos')
        .select(
          '*, categoria:categorias(id,nombre,slug,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo), producto_categorias(categoria_id, categoria:categorias(id,nombre,slug,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo))',
        )
        .eq('disponible_mayoreo', true)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: false }),
    ])
    categorias = ((cat.data as Categoria[] | null) ?? []).map(raiz => ({
      ...raiz,
      subcategorias: [...(raiz.subcategorias || [])]
        .filter(s => s.activa !== false)
        .sort((a, b) => a.orden - b.orden),
    }))
    productos = (prod.data as typeof productos | null) ?? []
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[MayoreoProductosPage] Error cargando datos:', error)
  }

  return (
    <ProductosClient
      productos={withProductoCategorias(productos)}
      categorias={categorias}
      initialQ={q || ''}
      initialCategoria={categoria || ''}
      catalogType="mayoreo"
    />
  )
}
