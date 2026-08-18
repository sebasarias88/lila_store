'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import type { AnuncioModal } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { sessionKeyAnuncio } from '@/lib/anuncio-modal'
import { useScrollLock } from '@/lib/useScrollLock'

type Props = {
  anuncio: AnuncioModal | null
  catalogType?: CatalogType
}

export default function AnuncioModalPromo({
  anuncio,
  catalogType = 'detal',
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!anuncio) {
      setOpen(false)
      return
    }
    if (anuncio.mostrar_una_vez_por_sesion) {
      try {
        const key = sessionKeyAnuncio(anuncio.id)
        if (sessionStorage.getItem(key) === '1') {
          setOpen(false)
          return
        }
      } catch {
        // sessionStorage no disponible
      }
    }
    const t = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(t)
  }, [anuncio])

  useScrollLock(open)

  const markSeenAndClose = () => {
    if (anuncio?.mostrar_una_vez_por_sesion) {
      try {
        sessionStorage.setItem(sessionKeyAnuncio(anuncio.id), '1')
      } catch {
        // ignore
      }
    }
    setOpen(false)
  }

  if (!anuncio) return null

  const productoHref = anuncio.producto_id
    ? anuncio.producto?.slug
      ? catalogPath(catalogType, `/productos/${anuncio.producto.slug}`)
      : null
    : null
  const externalHref =
    !anuncio.producto_id && anuncio.enlace_manual
      ? anuncio.enlace_manual
      : null
  const ctaLabel = anuncio.texto_boton?.trim() || 'Ver más'

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar anuncio"
            className="fixed inset-0 z-[80] bg-[rgba(58,46,61,0.48)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={markSeenAndClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="anuncio-modal-titulo"
            className="fixed left-1/2 top-1/2 z-[90] w-[min(100%-1.5rem,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_24px_60px_rgba(110,79,168,0.22)]"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={markSeenAndClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            {anuncio.imagen_url ? (
              <div className="relative w-full overflow-hidden bg-[var(--bg-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anuncio.imagen_url}
                  alt=""
                  className="block h-[min(48vh,360px)] w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-surface)] to-transparent" />
              </div>
            ) : null}

            <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1">
                <Sparkles size={12} className="text-[var(--accent-primary)]" />
                <span className="text-[11px] font-bold text-[var(--accent-deep)]">
                  Novedad
                </span>
              </div>

              <h2
                id="anuncio-modal-titulo"
                className="text-[1.35rem] font-bold leading-tight text-[var(--text-primary)]"
              >
                {anuncio.titulo || 'Algo nuevo para ti ✨'}
              </h2>

              {anuncio.descripcion ? (
                <p className="mt-2 text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
                  {anuncio.descripcion}
                </p>
              ) : null}

              <div className="mt-5">
                {productoHref ? (
                  <Link
                    href={productoHref}
                    onClick={markSeenAndClose}
                    className="catalog-gold-cta flex w-full items-center justify-center rounded-full py-3.5 text-[14px] font-bold"
                  >
                    {ctaLabel}
                  </Link>
                ) : externalHref ? (
                  <a
                    href={externalHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={markSeenAndClose}
                    className="catalog-gold-cta flex w-full items-center justify-center rounded-full py-3.5 text-[14px] font-bold"
                  >
                    {ctaLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={markSeenAndClose}
                    className="catalog-gold-cta flex w-full items-center justify-center rounded-full py-3.5 text-[14px] font-bold"
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
