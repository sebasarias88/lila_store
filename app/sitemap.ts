import type { MetadataRoute } from 'next'
import { createSupabasePublic } from '@/lib/supabase-public'
import { catalogCategoriaPath, catalogPath } from '@/lib/catalog'
import { toAbsoluteUrl } from '@/lib/seo'
import {
  fetchCategoriasRaiz,
  flattenCategoriaSlugs,
} from '@/lib/catalog-categorias'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabasePublic()

  const [{ data: productos }, categorias] = await Promise.all([
    supabase
      .from('productos')
      .select('slug, updated_at, disponible_detal, disponible_mayoreo')
      .eq('disponible', true)
      .order('updated_at', { ascending: false }),
    fetchCategoriasRaiz().catch(() => []),
  ])

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: toAbsoluteUrl('/productos'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl('/mayorista'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: toAbsoluteUrl('/mayorista/productos'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    ...['/terminos-y-condiciones', '/politica-de-privacidad', '/politica-de-cookies'].map(path => ({
      url: toAbsoluteUrl(path),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),
  ]

  // Only canonical URLs: wholesale pages of products/categories sold in retail
  // point to the retail page, so they are left out.
  const categorySlugs = flattenCategoriaSlugs(categorias)
  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map(slug => ({
    url: toAbsoluteUrl(catalogCategoriaPath('detal', slug)),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = (productos ?? []).flatMap(producto => {
    const lastModified = producto.updated_at ? new Date(producto.updated_at) : now
    if (producto.disponible_detal !== false) {
      return [
        {
          url: toAbsoluteUrl(`/productos/${producto.slug}`),
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.75,
        },
      ]
    }
    if (producto.disponible_mayoreo !== false) {
      return [
        {
          url: toAbsoluteUrl(catalogPath('mayoreo', `/productos/${producto.slug}`)),
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        },
      ]
    }
    return []
  })

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
