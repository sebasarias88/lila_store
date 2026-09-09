import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductosClient from '@/components/catalog/ProductosClient'
import { buildCategoriaMetadata, breadcrumbJsonLd, toAbsoluteUrl } from '@/lib/seo'
import { getSiteConfig, getSiteName } from '@/lib/site-config'
import {
  CATALOG_PAGE_SIZE,
  getCatalogProductosPage,
  type CatalogOrden,
} from '@/lib/catalog-productos'
import {
  fetchCategoriasRaiz,
  findCategoriaBySlug,
} from '@/lib/catalog-categorias'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'
import JsonLd from '@/components/seo/JsonLd'
import { catalogCategoriaPath } from '@/lib/catalog'

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
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const config = await getSiteConfig()
  const categorias = await fetchCategoriasRaiz()
  const cat = findCategoriaBySlug(categorias, slug)
  if (!cat) {
    return { title: 'Categoría no encontrada', robots: { index: false, follow: false } }
  }
  return buildCategoriaMetadata({
    config,
    categoriaNombre: cat.nombre,
    categoriaSlug: cat.slug,
    catalogType: 'detal',
  })
}

export default async function ProductosCategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string; orden?: string }>
}) {
  const { slug } = await params
  const { q, page: pageRaw, orden: ordenRaw } = await searchParams
  const page = Math.max(1, Number(pageRaw) || 1)
  const orden = parseOrden(ordenRaw)

  let categorias = await fetchCategoriasRaiz().catch(error => {
    rethrowIfNextControlFlowError(error)
    console.error('[ProductosCategoriaPage] categorias:', error)
    return []
  })

  const cat = findCategoriaBySlug(categorias, slug)
  if (!cat) notFound()

  let productos: Awaited<ReturnType<typeof getCatalogProductosPage>>['productos'] =
    []
  let total = 0
  let totalPages = 0

  try {
    const result = await getCatalogProductosPage({
      catalogType: 'detal',
      page,
      pageSize: CATALOG_PAGE_SIZE,
      q,
      categoriaSlug: cat.slug,
      categoriasRaiz: categorias,
      orden,
    })
    productos = result.productos
    total = result.total
    totalPages = result.totalPages
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[ProductosCategoriaPage] productos:', error)
  }

  const config = await getSiteConfig()
  const siteName = getSiteName(config)
  const categoryPath = catalogCategoriaPath('detal', cat.slug)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Productos', path: '/productos' },
            { name: cat.nombre, path: categoryPath },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: cat.nombre,
            description: `Productos de ${cat.nombre} en ${siteName}`,
            url: toAbsoluteUrl(categoryPath),
            isPartOf: { '@type': 'WebSite', name: siteName, url: toAbsoluteUrl('/') },
          },
        ]}
      />
      <ProductosClient
        productos={productos}
        categorias={categorias}
        initialQ={q || ''}
        initialCategoria={cat.slug}
        catalogType="detal"
        page={page}
        pageSize={CATALOG_PAGE_SIZE}
        total={total}
        totalPages={totalPages}
        orden={orden}
      />
    </>
  )
}
