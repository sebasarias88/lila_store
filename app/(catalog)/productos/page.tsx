import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProductosClient from '@/components/catalog/ProductosClient'
import { buildMetadata } from '@/lib/seo'
import { getSiteConfig, getSiteName } from '@/lib/site-config'
import { withProductoCategorias } from '@/lib/producto-categorias'
import type { Categoria, Producto } from '@/types'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; marca?: string }>
}): Promise<Metadata> {
  const { q, categoria } = await searchParams
  const config = await getSiteConfig()
  const siteName = getSiteName(config)
  const query = q?.trim()
  const categorySlug = categoria?.trim()
  const hasFilters = Boolean(query || categorySlug)

  let title = 'Catálogo detal'
  let description = `Explora el catálogo detal de belleza y cuidado capilar de ${siteName}. Envíos a toda Colombia.`
  let path = '/productos'

  if (query) {
    title = `Detal: "${query}"`
    description = `Productos detal que coinciden con "${query}" en ${siteName}.`
    path = `/productos?q=${encodeURIComponent(query)}`
  } else if (categorySlug) {
    title = 'Detal por categoría'
    description = `Productos detal filtrados por categoría en ${siteName}.`
    path = `/productos?categoria=${encodeURIComponent(categorySlug)}`
  }

  return buildMetadata({
    config,
    title,
    description,
    path,
    noIndex: hasFilters,
  })
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; marca?: string }>
}) {
  const { q, categoria, marca } = await searchParams

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
        .eq('disponible_detal', true)
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
    console.error('[ProductosPage] Error cargando datos:', error)
  }

  return (
    <ProductosClient
      productos={withProductoCategorias(productos)}
      categorias={categorias}
      initialQ={q || ''}
      initialCategoria={categoria || ''}
      initialMarca={marca || ''}
    />
  )
}