'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, Sparkles, Tag, TrendingUp, X } from 'lucide-react'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import { SEARCH_SUGGESTIONS } from '@/lib/search-suggestions'
import type { Categoria } from '@/types'

type Props = {
  open: boolean
  onClose: () => void
  catalogType?: CatalogType
  categorias?: Categoria[]
}

/**
 * Overlay de búsqueda desktop: campo amplio + categorías + sugerencias.
 */
export default function DesktopSearchOverlay({
  open,
  onClose,
  catalogType = 'detal',
  categorias = [],
}: Props) {
  const router = useGuardedRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const productosPath = catalogPath(catalogType, '/productos')
  const categoriasRapidas = categorias.slice(0, 8)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery('')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const goSearch = (q: string) => {
    const trimmed = q.trim()
    onClose()
    router.push(
      trimmed
        ? `${productosPath}?q=${encodeURIComponent(trimmed)}`
        : productosPath,
    )
  }

  const goCategoria = (slug: string) => {
    onClose()
    router.push(`${productosPath}?categoria=${encodeURIComponent(slug)}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    goSearch(query)
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[min(14vh,7rem)] pb-10 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Cerrar búsqueda"
            className="absolute inset-0 bg-[rgba(42,31,46,0.38)] backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[rgba(232,136,181,0.14)] blur-2xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-[rgba(183,156,232,0.12)] blur-2xl" />

            <div className="relative flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                  <Search size={18} />
                </span>
                <div>
                  <p id={titleId} className="text-[15px] font-bold text-[var(--text-primary)]">
                    Buscar
                  </p>
                  <p className="text-[12px] font-medium text-[var(--text-muted)]">
                    Productos, marcas y categorías
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative px-5 py-5 sm:px-6 sm:py-6">
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] p-1.5 transition-colors focus-within:border-[var(--accent-primary)] focus-within:bg-white focus-within:shadow-[var(--shadow-soft)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--text-subtle)]">
                    <Search size={18} />
                  </span>
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Labial, sombra, skincare…"
                    aria-label="Buscar productos"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--placeholder)]"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        inputRef.current?.focus()
                      }}
                      aria-label="Limpiar"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="catalog-gold-cta inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-bold sm:px-5"
                    aria-label="Buscar"
                  >
                    <span className="hidden sm:inline">Buscar</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>

              {categoriasRapidas.length > 0 && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center gap-2">
                    <Tag size={14} className="text-[var(--accent-primary)]" />
                    <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                      Categorías
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoriasRapidas.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => goCategoria(cat.slug)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]"
                      >
                        <Sparkles size={12} className="text-[var(--accent-primary)]" />
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[var(--accent-primary)]" />
                  <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                    Populares
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SEARCH_SUGGESTIONS.map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => goSearch(term)}
                      className="rounded-full bg-[var(--bg-muted)] px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-[12px] font-medium text-[var(--text-subtle)]">
                Esc para cerrar · Enter para buscar
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
