'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Banner } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { useGuardedRouter } from '@/lib/useGuardedRouter'

type HeroBannerProps = {
  banners: Banner[]
  config: Record<string, string>
  catalogType?: CatalogType
}

/**
 * Banner full-bleed: solo imagen (sin texto encima).
 * Controles mínimos del carrusel.
 */
export default function HeroBanner({
  banners,
  config: _config,
  catalogType = 'detal',
}: HeroBannerProps) {
  void _config
  const router = useGuardedRouter()
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const bannersConImagen = banners.filter(b => b.imagen_url)
  const hasImages = bannersConImagen.length > 0
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
    document.documentElement.setAttribute(
      'data-hero-has-image',
      hasImages ? 'true' : 'false',
    )
    document.documentElement.setAttribute('data-hero-layout', 'image-only')
    return () => {
      document.documentElement.removeAttribute('data-hero-has-image')
      document.documentElement.removeAttribute('data-hero-layout')
    }
  }, [hasImages])

  const handleBannerClick = () => {
    const href = currentBanner?.enlace_boton?.trim()
    if (!href) return
    if (href.startsWith('http') || href.startsWith('/')) {
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
      return
    }
    router.push(catalogPath(catalogType, `/${href}`))
  }

  const clickable = Boolean(currentBanner?.enlace_boton?.trim())

  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-[var(--bg-muted)]"
      data-hero-banner="true"
      data-hero-layout="image-only"
      data-hero-has-image={hasImages ? 'true' : 'false'}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div
        className={`absolute inset-0 ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? handleBannerClick : undefined}
        onKeyDown={
          clickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleBannerClick()
                }
              }
            : undefined
        }
        role={clickable ? 'link' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={
          clickable
            ? currentBanner?.texto_boton || currentBanner?.titulo || 'Ver promoción'
            : undefined
        }
      >
        <AnimatePresence mode="wait">
          {hasImages && currentBanner ? (
            <motion.div
              key={current}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={currentBanner.imagen_url}
                alt={currentBanner.titulo || 'Banner promocional'}
                className="h-full w-full object-cover object-center"
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              className="absolute inset-0 bg-gradient-to-br from-[#F0EAFB] via-[#F3EBFF] to-[#EEE8FC]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_25%_25%,rgba(169,137,224,0.4),transparent_42%),radial-gradient(circle_at_75%_70%,rgba(232,160,200,0.3),transparent_45%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl opacity-80" aria-hidden>
                  💖
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft top wash so the navbar stays readable — no copy overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(249,246,255,0.55)] to-transparent" />
      </div>

      {bannersConImagen.length > 1 && (
        <>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:bg-[var(--accent-primary)] hover:text-white md:flex"
            aria-label="Banner anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:bg-[var(--accent-primary)] hover:text-white md:flex"
            aria-label="Banner siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/40 bg-white/85 px-3.5 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm">
            {bannersConImagen.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setCurrent(i)
                }}
                aria-label={`Ir al banner ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'h-2.5 w-7 bg-[var(--accent-primary)]'
                    : 'h-2.5 w-2.5 bg-[var(--border)] hover:bg-[var(--accent-secondary)]'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
