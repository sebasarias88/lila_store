'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Producto } from '@/types'
import { type CatalogType } from '@/lib/catalog'
import ResponsiveProductCard from '@/components/catalog/mobile/ResponsiveProductCard'
import HorizontalCarousel from '@/components/ui/HorizontalCarousel'
import type { ReactNode } from 'react'

type Props = {
  productos: Producto[]
  catalogType?: CatalogType
  eyebrow: string
  title: ReactNode
  description?: string
  verMasHref: string
  verMasLabel?: string
  /** Fondo sutil para alternar secciones */
  muted?: boolean
  sectionId?: string
}

export default function ProductosCarousel({
  productos,
  catalogType = 'detal',
  eyebrow,
  title,
  description,
  verMasHref,
  verMasLabel = 'Ver más',
  muted = false,
  sectionId,
}: Props) {
  if (!productos.length) return null

  return (
    <section
      id={sectionId}
      className={`scroll-mt-28 py-12 sm:py-14 ${muted ? 'bg-[var(--bg-muted)]' : 'bg-[var(--bg-base)]'}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
              <span className="catalog-eyebrow">{eyebrow}</span>
            </div>
            <h2 className="catalog-section-title text-[1.85rem] leading-none sm:text-[2.15rem]">
              {title}
            </h2>
            {description && (
              <p className="mt-3 max-w-lg text-[14px] catalog-lead leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <Link
            href={verMasHref}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-[13px] font-bold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]"
          >
            {verMasLabel}
            <ArrowRight
              size={14}
              className="text-[var(--accent-primary)] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

        <HorizontalCarousel
          itemClassName="w-[68vw] sm:w-[240px] lg:w-[260px]"
          gapClassName="gap-3 sm:gap-4"
        >
          {productos.map((producto, i) => (
            <motion.div
              key={producto.id}
              className="h-full overflow-hidden rounded-[20px]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <ResponsiveProductCard producto={producto} catalogType={catalogType} />
            </motion.div>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  )
}
