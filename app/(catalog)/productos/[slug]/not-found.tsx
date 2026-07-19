import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { getSiteConfig } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return buildMetadata({
    config,
    title: 'Producto no encontrado',
    description: 'El producto que buscas no existe o ya no está disponible.',
    path: '/productos',
    noIndex: true,
  })
}

export default function ProductoNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-[10px] font-light uppercase tracking-[4px] text-[var(--gold-subtle)]">
        404
      </p>
      <h1 className="text-3xl font-thin uppercase tracking-[2px] text-[var(--text-primary)]">
        Producto no encontrado
      </h1>
      <p className="text-[13px] font-light text-[var(--text-subtle)]">
        El producto que buscas no existe o fue eliminado.
      </p>
      <Link
        href="/productos"
        className="rounded-[2px] border border-[var(--border)] px-6 py-3 text-[10px] font-light uppercase tracking-[2.5px] text-[var(--gold)] transition-all hover:bg-[var(--gold-muted)]"
      >
        Ver catálogo
      </Link>
    </div>
  )
}
