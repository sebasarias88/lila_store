'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Categoria } from '@/types'
import { catalogPath, catalogCategoriaPath, type CatalogType } from '@/lib/catalog'
import { ArrowRight, Sparkles } from 'lucide-react'
import { categoriaTieneDescuentoActivo } from '@/lib/descuentos'
import ThumbImg from '@/components/catalog/ThumbImg'
import HorizontalCarousel from '@/components/ui/HorizontalCarousel'

/** Categories shown in the home carousel; the rest are one click away ("Ver todas"). */
const MAX_VISIBLE = 16

const PASTELS = [
  'from-[#EEE8FC] to-[#F3EBFF]',
  'from-[#E8E0FA] to-[#F0EAFB]',
  'from-[#F5E9FF] to-[#EEE8FC]',
  'from-[#EDE4F8] to-[#F8EAF4]',
  'from-[#F0EAFB] to-[#E8DDF8]',
  'from-[#F3EBFF] to-[#EEE8FC]',
  'from-[#EAE2F7] to-[#F5E9FF]',
  'from-[#F0E8FC] to-[#F8EAF4]',
]

function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '•'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function CategoriasGrid({
  categorias,
  catalogType = 'detal',
}: {
  categorias: Categoria[]
  catalogType?: CatalogType
}) {
  if (!categorias.length) return null

  const productosHref = catalogPath(catalogType, '/productos')
  const visibles = categorias.slice(0, MAX_VISIBLE)
  const hayMas = categorias.length > MAX_VISIBLE

  return (
    <section
      id="categorias"
      className="scroll-mt-28 relative overflow-x-clip bg-[var(--bg-base)] py-12 sm:py-14"
    >
      <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-6 h-32 w-32 rounded-full bg-[rgba(232,160,200,0.1)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3 py-1.5">
              <Sparkles size={13} className="text-[var(--accent-primary)]" />
              <span className="text-[12px] font-bold text-[var(--accent-deep)]">Explorar ✨</span>
            </div>
            <h2 className="text-[1.85rem] font-bold leading-none text-[var(--text-primary)] sm:text-[2.15rem]">
              Categorías <span className="text-[var(--accent-primary)]">favoritas</span>
            </h2>
            <p className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
              Elige tu vibe cute y encuentra justo lo que necesitas 💕
            </p>
          </div>

          <Link
            href={productosHref}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-[13px] font-bold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]"
          >
            {hayMas ? 'Ver todas' : 'Ver catálogo'}
            <ArrowRight
              size={14}
              className="text-[var(--accent-primary)] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

        {/* One row on every screen: swipe on phones, arrows on desktop. */}
        <HorizontalCarousel
          label="Categorías favoritas"
          itemClassName="w-[6.75rem] sm:w-[9rem] lg:w-[10.25rem]"
          gapClassName="gap-4 sm:gap-6"
          arrowTopClassName="top-[38%]"
        >
          {visibles.map((cat, i) => (
            <CategoriaCard
              key={cat.id}
              cat={cat}
              index={i}
              catalogType={catalogType}
            />
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  )
}

function CategoriaCard({
  cat,
  index,
  catalogType = 'detal',
}: {
  cat: Categoria
  index: number
  catalogType?: CatalogType
}) {
  const conDescuento = categoriaTieneDescuentoActivo(cat, catalogType)
  const pctDescuento =
    catalogType === 'mayoreo' ? cat.descuento_porcentaje_mayoreo : cat.descuento_porcentaje
  const pastel = PASTELS[index % PASTELS.length]
  const subCount = Array.isArray(cat.subcategorias)
    ? cat.subcategorias.filter(s => s.activa !== false).length
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.28) }}
      className="w-full px-0.5"
    >
      <Link
        href={catalogCategoriaPath(catalogType, cat.slug)}
        className="group flex flex-col items-center text-center"
      >
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-full border-2 border-white bg-gradient-to-br ${pastel} shadow-[0_10px_28px_-10px_rgba(169,137,224,0.4)] ring-2 ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_36px_-12px_rgba(169,137,224,0.5)] group-hover:ring-[var(--accent-primary)] group-active:scale-[0.97]`}
        >
          {cat.imagen_url ? (
            <ThumbImg
              src={cat.imagen_url}
              alt={cat.nombre}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="text-[1.35rem] font-bold tracking-wide text-[var(--accent-deep)] opacity-80 sm:text-[1.75rem]"
              >
                {initials(cat.nombre)}
              </span>
            </div>
          )}

          {conDescuento && (
            <span className="absolute bottom-1.5 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{pctDescuento}%
            </span>
          )}
        </div>

        <p
          className="mt-3.5 line-clamp-2 text-[12px] font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-deep)] sm:text-[14px]"
        >
          {cat.nombre}
        </p>
        {subCount > 0 ? (
          <p className="mt-1 hidden text-[11px] font-medium text-[var(--text-muted)] sm:block">
            {subCount} {subCount === 1 ? 'subcategoría' : 'subcategorías'}
          </p>
        ) : null}
      </Link>
    </motion.div>
  )
}
