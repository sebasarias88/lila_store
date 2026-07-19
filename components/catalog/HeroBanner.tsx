'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { Banner } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'

type HeroBannerProps = {
  banners: Banner[]
  config: Record<string, string>
  catalogType?: CatalogType
}

export default function HeroBanner({
  banners,
  config,
  catalogType = 'detal',
}: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const bannersConImagen = banners.filter(b => b.imagen_url)
  const hasImages = bannersConImagen.length > 0
  const isMayoreo = catalogType === 'mayoreo'
  const currentBanner = bannersConImagen[current]

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % Math.max(bannersConImagen.length, 1))
  }, [bannersConImagen.length])

  const prev = () => {
    setCurrent(c =>
      (c - 1 + Math.max(bannersConImagen.length, 1)) % Math.max(bannersConImagen.length, 1),
    )
  }

  useEffect(() => {
    if (!isPlaying || bannersConImagen.length <= 1) return
    const timer = setInterval(next, 5500)
    return () => clearInterval(timer)
  }, [isPlaying, next, bannersConImagen.length])

  useEffect(() => {
    document.documentElement.setAttribute('data-hero-has-image', 'false')
    document.documentElement.setAttribute('data-hero-layout', 'split')
    return () => {
      document.documentElement.removeAttribute('data-hero-has-image')
      document.documentElement.removeAttribute('data-hero-layout')
    }
  }, [])

  const pickCopy = (value?: string | null) => {
    const text = value?.trim()
    if (!text || /ritual/i.test(text)) return ''
    return text.replace(/\bmayoreo\b/gi, 'mayorista')
  }

  const title =
    pickCopy(currentBanner?.titulo) ||
    pickCopy(config['hero_titulo']) ||
    (isMayoreo ? 'Precios mayoristas' : 'Belleza que se siente')

  const subtitle =
    pickCopy(currentBanner?.subtitulo) ||
    pickCopy(config['hero_subtitulo']) ||
    (isMayoreo
      ? pickCopy(config['mayoreo_titulo']) ||
        'Precios especiales para revendedoras. Compra fácil y rápida.'
      : 'Maquillaje, skincare y cuidados con vibes frescas para cada día.')

  const ctaLabel = currentBanner?.texto_boton?.trim() || 'Ver catálogo'
  const bannerHref = currentBanner?.enlace_boton?.trim() || null
  const primaryHref = bannerHref
    ? bannerHref.startsWith('http') || bannerHref.startsWith('/')
      ? bannerHref
      : catalogPath(catalogType, `/${bannerHref}`)
    : catalogPath(catalogType, '/productos')

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-base)] px-4 pb-4 pt-[calc(2.25rem+3.5rem+0.75rem+env(safe-area-inset-top,0px))] sm:px-6 md:pb-6 md:pt-[calc(2.25rem+4rem+1rem)] lg:px-8"
      data-hero-banner="true"
      data-hero-layout="split"
      data-hero-has-image="false"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div className="pointer-events-none absolute -left-10 top-20 h-40 w-40 rounded-full bg-[rgba(232,136,181,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-4 h-44 w-44 rounded-full bg-[rgba(183,156,232,0.14)] blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[1fr_1.05fr] lg:gap-5">
        {/* Copy panel */}
        <motion.div
          className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-9 sm:py-10 lg:min-h-[480px] lg:px-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 bg-[rgba(232,136,181,0.12)] [border-radius:60%_40%_55%_45%/45%_55%_40%_60%]" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] font-bold text-[var(--accent-deep)]">
                <Sparkles size={13} className="text-[var(--accent-primary)]" />
                {isMayoreo ? 'Mayorista cute' : 'New drops'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] font-bold text-[var(--accent-primary)]">
                ✨ 10% OFF · LILA10
              </span>
            </div>

            <h1 className="mt-5 max-w-lg text-[2.2rem] leading-[1.02] text-[var(--text-primary)] sm:text-[3rem] lg:text-[3.4rem]">
              {title}
            </h1>

            <p className="mt-4 max-w-md text-[15px] font-medium leading-7 text-[var(--text-secondary)]">
              {subtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="catalog-gold-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-bold"
              >
                <ShoppingBag size={16} />
                {ctaLabel}
                <ArrowRight size={15} />
              </Link>
              <a
                href="#categorias"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-[14px] font-bold text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                <Heart size={15} fill="currentColor" />
                Categorías
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:max-w-md">
              {[
                { emoji: '🚚', label: 'Envíos YA' },
                { emoji: '💬', label: 'WhatsApp' },
                { emoji: '🎀', label: 'Promo cute' },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-[16px] bg-[var(--bg-muted)] px-2 py-3 text-center"
                >
                  <p className="text-[16px]" aria-hidden>{item.emoji}</p>
                  <p className="mt-1 text-[11px] font-bold text-[var(--text-secondary)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Media panel */}
        <div
          className="relative min-h-[300px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-muted)] shadow-[var(--shadow-soft)] sm:min-h-[380px] lg:min-h-[480px]"
        >
          <AnimatePresence mode="wait">
            {hasImages && currentBanner ? (
              <motion.div
                key={current}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={currentBanner.imagen_url}
                  alt={currentBanner.titulo || 'Banner promocional'}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(58,46,61,0.35)] via-transparent to-transparent" />
              </motion.div>
            ) : (
              <motion.div
                key="fallback"
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FDEBF4] via-[var(--bg-muted)] to-[#EEE8FC]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <span className="text-6xl" aria-hidden>💖</span>
                  <p className="mt-3 text-[15px] font-bold text-[var(--accent-deep)]">
                    Tu glow-up empieza aquí
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {bannersConImagen.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                aria-label="Banner anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                aria-label="Banner siguiente"
              >
                <ChevronRight size={18} />
              </button>

              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/85 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm">
                {bannersConImagen.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Ir al banner ${i + 1}`}
                    className={`rounded-full transition-all ${
                      i === current
                        ? 'h-2.5 w-6 bg-[var(--accent-primary)]'
                        : 'h-2.5 w-2.5 bg-[var(--border)] hover:bg-[var(--accent-secondary)]'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
