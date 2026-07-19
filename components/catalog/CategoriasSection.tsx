'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { Tag, ArrowRight } from 'lucide-react'
import HorizontalCarousel from '@/components/ui/HorizontalCarousel'

export default function CategoriasSection({
  categorias,
  conteos,
  catalogType = 'detal',
}: {
  categorias: Categoria[]
  conteos?: Record<string, number>
  catalogType?: CatalogType
}) {
  const categoriasRaiz = useMemo(
    () =>
      categorias
        .filter(cat => cat.padre_id == null)
        .sort((a, b) => a.orden - b.orden),
    [categorias],
  )

  if (!categoriasRaiz.length) return null

  const productosHref = catalogPath(catalogType, '/productos')

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 border-b border-[var(--border-subtle)] pb-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <span className="catalog-eyebrow tracking-[3px]">
            Explorar
          </span>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-[1.75rem] font-thin uppercase leading-none tracking-[1.5px] text-[var(--text-primary)] sm:text-[2.125rem]">
                Por{' '}
                <span className="text-[var(--gold)]">categoría</span>
              </h2>
            </div>
            <p className="mt-3 max-w-lg text-[14px] catalog-lead leading-relaxed">
              Encuentra lo que buscas navegando por nuestras líneas de producto
            </p>
          </div>

          <Link
            href={productosHref}
            className="group inline-flex shrink-0 items-center gap-2 self-start border-b border-[var(--border)] pb-1 text-[11px] font-medium uppercase tracking-[2px] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] sm:mt-1"
          >
            Ver catálogo
            <ArrowRight
              size={14}
              className="text-[var(--gold-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]"
            />
          </Link>
        </div>
      </motion.div>

      <HorizontalCarousel itemClassName="w-[68vw] sm:w-[240px] lg:w-[260px]" gapClassName="gap-3 sm:gap-4">
        {categoriasRaiz.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="h-full"
          >
            <Link
              href={`${productosHref}?categoria=${cat.slug}`}
              className="mobile-catalog-category-card group relative block aspect-[4/5] overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] md:rounded-none"
            >
              {cat.imagen_url ? (
                <img
                  src={cat.imagen_url}
                  alt={cat.nombre}
                  className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--bg-muted)] transition-colors group-hover:bg-[var(--bg-surface)]">
                  <Tag size={24} className="text-[var(--gold)] opacity-35" />
                </div>
              )}

              <div className="bg-overlay-image absolute inset-0" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[13px] font-light uppercase tracking-[1.5px] text-[var(--text-inverse)] transition-colors group-hover:text-[var(--gold-bright)]">
                  {cat.nombre}
                </p>
                <p className="mt-1 text-[10px] font-light text-[rgba(248,246,241,0.5)]">
                  {conteos?.[cat.slug] || 0} productos
                </p>
                <div className="mt-1.5 h-px w-0 bg-[var(--gold-bright)] transition-all duration-300 group-hover:w-full" />
              </div>
            </Link>
          </motion.div>
        ))}
      </HorizontalCarousel>
    </section>
  )
}
