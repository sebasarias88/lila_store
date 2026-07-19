'use client'

import { useState, useEffect, useRef } from 'react'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import { Search, X, ArrowRight, TrendingUp, Tag, Sparkles } from 'lucide-react'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import MobileBottomSheet from '@/components/catalog/mobile/MobileBottomSheet'
import { SEARCH_SUGGESTIONS } from '@/lib/search-suggestions'
import type { Categoria } from '@/types'

type MobileSearchOverlayProps = {
  open: boolean
  onClose: () => void
  catalogType?: CatalogType
  categorias?: Categoria[]
  initialQuery?: string
}

export default function MobileSearchOverlay({
  open,
  onClose,
  catalogType = 'detal',
  categorias = [],
  initialQuery = '',
}: MobileSearchOverlayProps) {
  const router = useGuardedRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const productosPath = catalogPath(catalogType, '/productos')
  const categoriasRapidas = categorias.slice(0, 8)

  useEffect(() => {
    if (open) {
      setQuery(initialQuery)
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [open, initialQuery])

  const goSearch = (q: string) => {
    const trimmed = q.trim()
    onClose()
    if (trimmed) {
      router.push(`${productosPath}?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(productosPath)
    }
  }

  const goCategoria = (slug: string) => {
    onClose()
    router.push(`${productosPath}?categoria=${encodeURIComponent(slug)}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    goSearch(query)
  }

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title="Buscar"
      subtitle="Productos, marcas y categorías"
      height="auto"
      showClose={false}
    >
      <div className="px-5 pb-6 pt-1">
        <form onSubmit={handleSubmit} className="relative mb-6">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] p-1.5 focus-within:border-[var(--accent-primary)] focus-within:bg-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--text-subtle)]">
              <Search size={18} />
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Labial, sombra, skincare…"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--placeholder)]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mobile-catalog-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)]"
                aria-label="Limpiar"
              >
                <X size={16} />
              </button>
            ) : null}
            <button
              type="submit"
              className="catalog-gold-cta flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              aria-label="Buscar"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {categoriasRapidas.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Tag size={14} className="text-[var(--accent-primary)]" />
              <p className="text-[12px] font-bold text-[var(--accent-deep)]">Categorías</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoriasRapidas.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goCategoria(cat.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] active:border-[var(--accent-primary)] active:bg-[var(--bg-muted)] active:text-[var(--accent-deep)]"
                >
                  <Sparkles size={12} className="text-[var(--accent-primary)]" />
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-[var(--accent-primary)]" />
          <p className="text-[12px] font-bold text-[var(--accent-deep)]">Populares</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEARCH_SUGGESTIONS.map(term => (
            <button
              key={term}
              type="button"
              onClick={() => goSearch(term)}
              className="rounded-full bg-[var(--bg-muted)] px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] active:bg-[var(--accent-primary)] active:text-white"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </MobileBottomSheet>
  )
}
