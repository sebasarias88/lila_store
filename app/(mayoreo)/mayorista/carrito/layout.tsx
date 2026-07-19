import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { catalogPath } from '@/lib/catalog'
import { getSiteConfig, getSiteName } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  const siteName = getSiteName(config)

  return buildMetadata({
    config,
    title: 'Carrito de compras — Mayorista',
    description: `Revisa tu pedido mayorista en ${siteName}.`,
    path: catalogPath('mayoreo', '/carrito'),
    noIndex: true,
  })
}

export default function MayoreoCarritoLayout({ children }: { children: React.ReactNode }) {
  return children
}
