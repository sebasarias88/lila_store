'use client'

import { Suspense, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import { Search, ArrowDown, Sparkles, X } from 'lucide-react'
import { Categoria } from '@/types'
import { catalogPath, catalogCategoriaPath, type CatalogType } from '@/lib/catalog'
import GoldDecorations from '@/components/catalog/GoldDecorations'
import { DIRECCION_COMPLETA } from '@/lib/negocio'

const BeautyOrb3D = dynamic(() => import('@/components/catalog/BeautyOrb3D'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-xl bg-[var(--gold-muted)]" />
  ),
})

type HeroProps = {
  titulo: string
  subtitulo: string
  categorias: Categoria[]
  catalogType?: CatalogType
}

export default function HeroSection({ titulo, subtitulo, categorias, catalogType = 'detal' }: HeroProps) {
  const router = useGuardedRouter()
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLElement>(null)
  const productosPath = catalogPath(catalogType, '/productos')

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) router.push(`${productosPath}?q=${encodeURIComponent(trimmed)}`)
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const } },
  }

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">

      <GoldDecorations />

      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-[10%] w-[520px] h-[520px] bg-[radial-gradient(circle,var(--glow-gold)_0%,transparent_70%)]" />
        <div className="absolute bottom-1/3 left-[8%] w-[360px] h-[360px] bg-[radial-gradient(circle,var(--glow-gold-strong)_0%,transparent_70%)]" />
      </div>

      {/* Líneas decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-[28%] w-px h-full bg-gradient-to-b from-transparent via-[var(--border)] to-transparent hidden lg:block" />
        <div className="absolute top-0 left-[10%] w-px h-full bg-gradient-to-b from-transparent via-[var(--glow-gold-strong)] to-transparent" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className={`relative max-w-7xl mx-auto px-4 max-md:px-4 sm:px-6 lg:px-8 pb-24 w-full ${
          catalogType === 'mayoreo'
            ? 'max-md:pt-[6.25rem] pt-36 sm:pt-40'
            : 'max-md:pt-[4.5rem] pt-28 sm:pt-32'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center">

          {/* Columna izquierda — contenido */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl"
          >
            <motion.div variants={item} className="flex items-center gap-3 mb-6 sm:mb-7">
              <div className="h-px w-10 bg-[var(--gold)]" />
              <span className="catalog-eyebrow sm:text-xs tracking-[3px]">
                Belleza & Cuidado Capilar
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-[2.5rem] sm:text-6xl lg:text-[3.75rem] xl:text-7xl font-thin tracking-[-0.5px] leading-[1.05] text-[var(--text-primary)] mb-5 sm:mb-6"
              dangerouslySetInnerHTML={{
                __html: titulo.replace(
                  /\b(de|ideal|belleza)\b/gi,
                  '<span class="gold-shimmer">$1</span>'
                ),
              }}
            />

            <motion.p
              variants={item}
              className="text-[15px] sm:text-base catalog-lead leading-relaxed mb-8 sm:mb-9"
            >
              {subtitulo}
            </motion.p>

            <motion.form variants={item} onSubmit={handleSearch} className="relative max-w-lg">
              <Search
                size={16}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar shampoo, mascarillas, tintes…"
                className="w-full border-0 border-b-2 border-[var(--border-input)] bg-transparent py-3.5 pl-7 pr-24 text-sm font-normal text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--placeholder)] focus:border-[var(--gold)]"
              />
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] md:rounded-xl"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-[10px] font-light uppercase tracking-[1.5px] text-[var(--gold)] transition-colors hover:text-[var(--gold-bright)] md:rounded-xl"
                >
                  Buscar
                </button>
              </div>
            </motion.form>

            {categorias.length > 0 && (
              <motion.div variants={item} className="mt-6 max-w-lg">
                <div className="relative border-b border-[var(--border-subtle)]">
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--bg-base)] to-transparent" />

                  <div className="flex gap-0 overflow-x-auto scrollbar-hide pr-2">
                    {categorias.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => router.push(catalogCategoriaPath(catalogType, cat.slug))}
                        title={cat.nombre}
                        className="group relative max-w-[9.5rem] shrink-0 truncate px-3 py-3.5 text-[11px] font-light uppercase tracking-[1.2px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] sm:max-w-none sm:px-4 sm:py-4"
                      >
                        {cat.nombre}
                        <span className="absolute inset-x-2 bottom-0 h-px scale-x-0 bg-[var(--gold)] transition-transform duration-300 group-hover:scale-x-100 sm:inset-x-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              variants={item}
              className="flex items-center gap-3 mt-8 sm:mt-10 text-[11px] tracking-[1.5px] uppercase text-[var(--text-subtle)] font-light"
            >
              <div className="h-px w-8 bg-[var(--border)]" />
              {DIRECCION_COMPLETA} — Envíos a toda Colombia
            </motion.div>
          </motion.div>

          {/* Columna derecha — escena 3D */}
          <div className="hidden lg:block relative h-[560px] min-h-[500px]">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(169,137,224,0.14) 0%, rgba(169,137,224,0.24) 40%, transparent 70%)',
              }}
            />
            <div className="absolute inset-0">
              <Suspense
                fallback={
                  <div className="h-full w-full animate-pulse rounded-xl bg-[var(--gold-muted)]" />
                }
              >
                <BeautyOrb3D />
              </Suspense>
            </div>

            {/* Tarjeta glass-morphism flotante */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: [0, -8, 0],
              }}
              transition={{
                opacity: { delay: 1, duration: 0.6 },
                y: { delay: 1.6, duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute bottom-8 left-6 z-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur-md md:rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-[var(--gold)]" />
                <div>
                  <p className="text-[11px] font-light uppercase tracking-[2px] text-[var(--text-primary)]">
                    Productos Premium
                  </p>
                  <div className="mt-1.5 h-px w-10 bg-[var(--gold)]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowDown size={14} className="text-[var(--gold-subtle)]" />
      </motion.div>
    </section>
  )
}
