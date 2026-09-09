import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ProductosClient from '@/components/catalog/ProductosClient'
import { buildMetadata } from '@/lib/seo'
import { catalogCategoriaPath, catalogPath } from '@/lib/catalog'
import { getSiteConfig, getSiteName } from '@/lib/site-config'
import {
  CATALOG_PAGE_SIZE,
  getCatalogProductosPage,
  type CatalogOrden,
} from '@/lib/catalog-productos'
import { fetchCategoriasRaiz } from '@/lib/catalog-categorias'
import type { Categoria } from '@/types'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'

export const revalidate = 60

function parseOrden(raw: string | undefined): CatalogOrden {
  if (
    raw === 'precio-asc' ||
    raw === 'precio-desc' ||
    raw === 'nombre' ||
    raw === 'relevancia'
  ) {
    return raw
  }
  return 'relevancia'
}

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

  if (categorySlug && !query) {
    return { robots: { index: false, follow: true } }
  }

  let title = 'Catálogo mayorista'
  let description = `Productos de belleza mayoristas en ${siteName}. Envíos a toda Colombia.`
  let path = catalogPath('mayoreo', '/productos')
  let noIndex = false

  if (query) {
    title = `Mayorista: "${query}"`
    description = `Resultados mayoristas para "${query}" en ${siteName}.`
    path = `${path}?q=${encodeURIComponent(query)}`
    noIndex = true
  }

  return buildMetadata({
    config,
    title,
    description,
    path,
    noIndex,
  })
}

export default async function MayoreoProductosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    categoria?: string
    page?: string
    orden?: string
  }>
}) {
  const { q, categoria, page: pageRaw, orden: ordenRaw } = await searchParams

  const catSlug = categoria?.trim()
  if (catSlug) {
    const params = new URLSearchParams()
    if (q?.trim()) params.set('q', q.trim())
    if (ordenRaw && ordenRaw !== 'relevancia') params.set('orden', ordenRaw)
    if (pageRaw && Number(pageRaw) > 1) params.set('page', pageRaw)
    const qs = params.toString()
    const dest = catalogCategoriaPath('mayoreo', catSlug)
    redirect(qs ? `${dest}?${qs}` : dest)
  }

  const page = Math.max(1, Number(pageRaw) || 1)
  const orden = parseOrden(ordenRaw)

  let categorias: Categoria[] = []
  let productos: Awaited<ReturnType<typeof getCatalogProductosPage>>['productos'] =
    []
  let total = 0
  let totalPages = 0

  try {
    categorias = await fetchCategoriasRaiz()
    const result = await getCatalogProductosPage({
      catalogType: 'mayoreo',
      page,
      pageSize: CATALOG_PAGE_SIZE,
      q,
      categoriasRaiz: categorias,
      orden,
    })
    productos = result.productos
    total = result.total
    totalPages = result.totalPages
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[MayoreoProductosPage] Error cargando datos:', error)
  }

  return (
    <ProductosClient
      productos={productos}
      categorias={categorias}
      initialQ={q || ''}
      initialCategoria=""
      catalogType="mayoreo"
      page={page}
      pageSize={CATALOG_PAGE_SIZE}
      total={total}
      totalPages={totalPages}
      orden={orden}
    />
  )
}
