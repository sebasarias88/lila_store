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
      .select('slug, updated_at')
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
  ]

  const categorySlugs = flattenCategoriaSlugs(categorias)
  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.flatMap(slug => [
    {
      url: toAbsoluteUrl(catalogCategoriaPath('detal', slug)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl(catalogCategoriaPath('mayoreo', slug)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.55,
    },
  ])

  const productRoutes: MetadataRoute.Sitemap = (productos ?? []).flatMap(
    producto => [
      {
        url: toAbsoluteUrl(`/productos/${producto.slug}`),
        lastModified: producto.updated_at
          ? new Date(producto.updated_at)
          : now,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      },
      {
        url: toAbsoluteUrl(catalogPath('mayoreo', `/productos/${producto.slug}`)),
        lastModified: producto.updated_at
          ? new Date(producto.updated_at)
          : now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      },
    ],
  )

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
