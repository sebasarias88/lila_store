import type { Metadata } from 'next'
import type { Producto } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import {
  getSiteDescription,
  getSiteKeywords,
  getSiteName,
  type SiteConfigMap,
} from '@/lib/site-config'
import { DIRECCION_NEGOCIO } from '@/lib/negocio'

const LOCALE = 'es_CO'

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getSiteUrl()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

type BuildMetadataInput = {
  config: SiteConfigMap
  title: string
  description?: string
  path: string
  image?: string | null
  keywords?: string[]
  noIndex?: boolean
}

export function buildMetadata({
  config,
  title,
  description,
  path,
  image,
  keywords,
  noIndex,
}: BuildMetadataInput): Metadata {
  const siteName = getSiteName(config)
  const desc = description || getSiteDescription(config)
  const url = toAbsoluteUrl(path)
  const ogImage = image ? toAbsoluteUrl(image) : toAbsoluteUrl('/opengraph-image')

  const fullTitle = title === siteName ? title : `${title} | ${siteName}`

  return {
    title,
    description: desc,
    keywords: keywords ?? getSiteKeywords(config),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: LOCALE,
      url,
      siteName,
      title: fullTitle,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  }
}

export function buildProductMetadata(
  config: SiteConfigMap,
  producto: Pick<Producto, 'nombre' | 'descripcion' | 'imagenes' | 'slug'>,
  catalogType: CatalogType = 'detal',
): Metadata {
  const siteName = getSiteName(config)
  const suffix = catalogType === 'mayoreo' ? ' — Mayorista' : ' — Detal'
  const title = `${producto.nombre}${suffix}`
  const description =
    producto.descripcion?.trim() ||
    `${producto.nombre}${
      catalogType === 'mayoreo' ? ' en el catálogo mayorista' : ' en el catálogo detal'
    } de ${siteName}. Envíos a toda Colombia.`
  const path = catalogPath(catalogType, `/productos/${producto.slug}`)
  const image = producto.imagenes?.[0] ?? null

  return buildMetadata({ config, title, description, path, image })
}

export function productJsonLd(
  config: SiteConfigMap,
  producto: Producto,
  catalogType: CatalogType = 'detal',
) {
  const siteName = getSiteName(config)
  const url = toAbsoluteUrl(catalogPath(catalogType, `/productos/${producto.slug}`))
  const image = producto.imagenes?.[0] ? toAbsoluteUrl(producto.imagenes[0]) : undefined
  const price = catalogType === 'mayoreo' ? producto.precio_mayoreo : producto.precio
  const hasPrice = price != null && price > 0

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion || producto.nombre,
    ...(image ? { image: [image] } : {}),
    sku: producto.sku || producto.id,
    url,
    brand: { '@type': 'Brand', name: siteName },
    ...(producto.categoria?.nombre ? { category: producto.categoria.nombre } : {}),
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'COP',
            price,
            availability: producto.disponible
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: siteName },
          },
        }
      : {}),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}

export function organizationJsonLd(config: SiteConfigMap) {
  const siteName = getSiteName(config)
  const whatsapp = config.whatsapp_numero?.trim()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: getSiteUrl(),
    description: getSiteDescription(config),
    ...(whatsapp
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: `+${whatsapp}`,
            contactType: 'customer service',
            availableLanguage: 'Spanish',
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: DIRECCION_NEGOCIO,
      addressLocality: 'Armenia',
      addressRegion: 'Quindío',
      addressCountry: 'CO',
    },
  }
}

export function websiteJsonLd(config: SiteConfigMap) {
  const siteName = getSiteName(config)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: getSiteUrl(),
    description: getSiteDescription(config),
    inLanguage: 'es-CO',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteUrl()}/productos?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export const adminMetadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true, noimageindex: true },
}
