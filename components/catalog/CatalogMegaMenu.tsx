'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { Categoria } from '@/types'
import { catalogCategoriaPath, type CatalogType } from '@/lib/catalog'

type CatalogMegaMenuProps = {
  open: boolean
  onClose: () => void
  categorias: Categoria[]
  productosHref: string
  catalogType?: CatalogType
  /** Ancla el panel al trigger (padre relative) */
  className?: string
}

function getActiveSubs(cat: Categoria): Categoria[] {
  return (cat.subcategorias || [])
    .filter(s => s.activa !== false)
    .sort((a, b) => a.orden - b.orden)
}

/** Normaliza raíces + subcats aunque vengan planas. */
export function normalizeNavCategorias(categorias: Categoria[]): Categoria[] {
  const hasNested = categorias.some(c => (c.subcategorias?.length ?? 0) > 0)
  if (hasNested) {
    return categorias
      .filter(c => !c.padre_id && c.activa !== false)
      .map(c => ({
        ...c,
        subcategorias: getActiveSubs(c),
      }))
      .sort((a, b) => a.orden - b.orden)
  }

  const roots = categorias
    .filter(c => !c.padre_id && c.activa !== false)
    .sort((a, b) => a.orden - b.orden)

  if (roots.length === 0) {
    return [...categorias]
      .filter(c => c.activa !== false)
      .sort((a, b) => a.orden - b.orden)
  }

  return roots.map(root => ({
    ...root,
    subcategorias: categorias
      .filter(c => c.padre_id === root.id && c.activa !== false)
      .sort((a, b) => a.orden - b.orden),
  }))
}

function catHref(catalogType: CatalogType, slug: string) {
  return catalogCategoriaPath(catalogType, slug)
}

export default function CatalogMegaMenu({
  open,
  onClose,
  categorias,
  productosHref,
  catalogType = 'detal',
  className = '',
}: CatalogMegaMenuProps) {
  const roots = useMemo(() => normalizeNavCategorias(categorias), [categorias])
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeCat =
    roots.find(c => c.slug === activeSlug) ?? roots[0] ?? null
  const activeSubs = activeCat ? getActiveSubs(activeCat) : []

  useEffect(() => {
    if (!open) return
    setActiveSlug(roots[0]?.slug ?? null)
  }, [open, roots])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="menu"
          aria-label="Catálogo por categorías"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className={`absolute left-1/2 top-[calc(100%+0.65rem)] z-50 w-[min(94vw,640px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-dropdown)] ${className}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
            <div>
              <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                Explorar el catálogo ✨
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                Elige una categoría o mira todo
              </p>
            </div>
            <Link
              href={productosHref}
              onClick={onClose}
              className="shrink-0 rounded-full bg-[var(--bg-muted)] px-3.5 py-2 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
            >
              Ver todo →
            </Link>
          </div>

          {roots.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] font-medium text-[var(--text-muted)]">
                Pronto tendremos categorías aquí 💕
              </p>
              <Link
                href={productosHref}
                onClick={onClose}
                className="mt-3 inline-block text-[13px] font-bold text-[var(--accent-primary)] hover:underline"
              >
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
              {/* Padres */}
              <div className="max-h-[min(58vh,380px)] overflow-y-auto border-b border-[var(--border)] p-2 sm:border-b-0 sm:border-r">
                {roots.map(cat => {
                  const selected = activeCat?.slug === cat.slug
                  const subs = getActiveSubs(cat)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="menuitem"
                      onMouseEnter={() => setActiveSlug(cat.slug)}
                      onFocus={() => setActiveSlug(cat.slug)}
                      onClick={() => setActiveSlug(cat.slug)}
                      className={`flex w-full items-center gap-2.5 rounded-[16px] px-2.5 py-2.5 text-left transition-colors ${
                        selected
                          ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/70 hover:text-[var(--accent-deep)]'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[var(--bg-muted)] ring-1 ring-[var(--border)]">
                        {cat.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.imagen_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Sparkles size={14} className="text-[var(--accent-primary)]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold">
                          {cat.nombre}
                        </span>
                        {subs.length > 0 ? (
                          <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-subtle)]">
                            {subs.length} subcategorías
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 ${
                          selected
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-faint)]'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Subcats / detalle */}
              <div className="max-h-[min(58vh,380px)] overflow-y-auto p-3 sm:p-4">
                {activeCat ? (
                  <>
                    <Link
                      href={catHref(catalogType, activeCat.slug)}
                      onClick={onClose}
                      className="mb-3 flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--bg-muted)]/60 px-3 py-3 transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--bg-muted)]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-[var(--border)]">
                        {activeCat.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activeCat.imagen_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Sparkles size={16} className="text-[var(--accent-primary)]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-[var(--accent-deep)]">
                          Todo {activeCat.nombre.toLowerCase()}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-muted)]">
                          Ver productos de esta categoría
                        </span>
                      </span>
                      <ChevronRight size={15} className="text-[var(--accent-primary)]" />
                    </Link>

                    {activeSubs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {activeSubs.map(sub => (
                          <Link
                            key={sub.id}
                            href={catHref(catalogType, sub.slug)}
                            onClick={onClose}
                            className="rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]"
                          >
                            {sub.nombre}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="px-1 text-[12px] font-medium text-[var(--text-subtle)]">
                        Sin subcategorías — entra a ver todo {activeCat.nombre.toLowerCase()}
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
