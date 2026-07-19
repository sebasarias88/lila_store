import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getSiteConfig, getSiteName } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  const siteName = getSiteName(config)

  return buildMetadata({
    config,
    title: 'Carrito de compras',
    description: `Revisa tu pedido y completa la compra en ${siteName}.`,
    path: '/carrito',
    noIndex: true,
  })
}

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return children
}
