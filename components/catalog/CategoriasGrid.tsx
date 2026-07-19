'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { ArrowRight, Sparkles, Tag } from 'lucide-react'
import { categoriaTieneDescuentoActivo } from '@/lib/descuentos'

const MAX_VISIBLE = 8

const PASTELS = [
  'from-[#FDEBF4] to-[#F8E7F1]',
  'from-[#EEE8FC] to-[#F3EBFF]',
  'from-[#FCE8F0] to-[#FFF0F6]',
  'from-[#F5E9FF] to-[#FDEBF4]',
  'from-[#FFEAF3] to-[#F0E8FC]',
  'from-[#F8E7F1] to-[#EEE8FC]',
  'from-[#FFF0F6] to-[#FDEBF4]',
  'from-[#F3EBFF] to-[#FFEAF3]',
]

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
    <section id="categorias" className="scroll-mt-28 bg-[var(--bg-base)] py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
              <span className="text-[12px] font-bold text-[var(--accent-deep)]">Explorar</span>
            </div>
            <h2 className="text-[1.85rem] font-bold leading-none text-[var(--text-primary)] sm:text-[2.15rem]">
              Categorías
            </h2>
            <p className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
              Toca una categoría y entra al catálogo ✨
            </p>
          </div>

          <Link
            href={productosHref}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-[13px] font-bold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]"
          >
            {hayMas ? 'Ver todas' : 'Ver catálogo'}
            <ArrowRight
              size={14}
              className="text-[var(--accent-primary)] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

        {/* Mobile: horizontal circles */}
        <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-1 scrollbar-hide sm:hidden">
          {visibles.map((cat, i) => (
            <CategoriaCircle
              key={cat.id}
              cat={cat}
              index={i}
              productosHref={productosHref}
              catalogType={catalogType}
              size="mobile"
            />
          ))}
        </div>

        {/* Desktop: circle grid — beauty catalog style */}
        <div className="hidden grid-cols-3 gap-x-6 gap-y-8 sm:grid md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 xl:gap-x-4">
          {visibles.map((cat, i) => (
            <CategoriaCircle
              key={cat.id}
              cat={cat}
              index={i}
              productosHref={productosHref}
              catalogType={catalogType}
              size="desktop"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoriaCircle({
  cat,
  index,
  productosHref,
  catalogType = 'detal',
  size,
}: {
  cat: Categoria
  index: number
  productosHref: string
  catalogType?: CatalogType
  size: 'mobile' | 'desktop'
}) {
  const conDescuento = categoriaTieneDescuentoActivo(cat, catalogType)
  const pctDescuento =
    catalogType === 'mayoreo' ? cat.descuento_porcentaje_mayoreo : cat.descuento_porcentaje
  const pastel = PASTELS[index % PASTELS.length]
  const isMobile = size === 'mobile'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.28) }}
      className={isMobile ? 'w-[5.75rem] shrink-0' : 'mx-auto w-full max-w-[9rem]'}
    >
      <Link
        href={`${productosHref}?categoria=${encodeURIComponent(cat.slug)}`}
        className="group flex flex-col items-center text-center"
      >
        <div
          className={`relative overflow-hidden rounded-full border border-[var(--border)] bg-gradient-to-br ${pastel} shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-[color-mix(in_srgb,var(--accent-primary)_50%,var(--border))] group-hover:shadow-[var(--shadow-card-hover)] group-active:scale-[0.97] ${
            isMobile
              ? 'h-[5.75rem] w-[5.75rem]'
              : 'aspect-square w-full'
          }`}
        >
          {cat.imagen_url ? (
            <img
              src={cat.imagen_url}
              alt={cat.nombre}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Tag
                size={isMobile ? 24 : 28}
                className="text-[var(--accent-primary)] opacity-75"
              />
            </div>
          )}

          {conDescuento && (
            <span className="absolute bottom-1 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm sm:text-[10px]">
              -{pctDescuento}%
            </span>
          )}
        </div>

        <p
          className={`mt-3 line-clamp-2 font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-deep)] ${
            isMobile ? 'text-[12px]' : 'text-[13px] sm:text-[14px]'
          }`}
        >
          {cat.nombre}
        </p>
      </Link>
    </motion.div>
  )
}
