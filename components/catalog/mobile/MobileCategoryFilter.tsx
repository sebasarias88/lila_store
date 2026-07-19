'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Categoria } from '@/types'

type Props = {
  categorias: Categoria[]
  categoriaActiva: string
  onChange: (slug: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getActiveSubs(cat: Categoria): Categoria[] {
  return (cat.subcategorias || [])
    .filter(s => s.activa !== false)
    .sort((a, b) => a.orden - b.orden)
}

function resolveLabel(categorias: Categoria[], slug: string): string {
  if (!slug) return 'Todas las categorías'
  for (const cat of categorias) {
    if (cat.slug === slug) return cat.nombre
    const sub = getActiveSubs(cat).find(s => s.slug === slug)
    if (sub) return sub.nombre
  }
  return 'Categoría'
}

export default function MobileCategoryFilter({
  categorias,
  categoriaActiva,
  onChange,
  open,
  onOpenChange,
}: Props) {
  const [search, setSearch] = useState('')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const displayLabel = resolveLabel(categorias, categoriaActiva)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setExpandedSlug(null)
      return
    }
    for (const cat of categorias) {
      if (getActiveSubs(cat).some(s => s.slug === categoriaActiva)) {
        setExpandedSlug(cat.slug)
        return
      }
      if (cat.slug === categoriaActiva && getActiveSubs(cat).length > 0) {
        setExpandedSlug(cat.slug)
        return
      }
    }
  }, [open, categoriaActiva, categorias])

  const q = search.trim().toLowerCase()

  const visibleCats = useMemo(() => {
    if (!q) return categorias
    return categorias.filter(cat => {
      if (cat.nombre.toLowerCase().includes(q)) return true
      return getActiveSubs(cat).some(s => s.nombre.toLowerCase().includes(q))
    })
  }, [categorias, q])

  const pick = (slug: string) => {
    onChange(slug)
    onOpenChange(false)
  }

  const toggleExpand = (slug: string) => {
    setExpandedSlug(prev => (prev === slug ? null : slug))
  }

  return (
    <div className="mobile-filter-dropdown relative">
      <span className="mb-2 block text-[11px] font-bold text-[var(--text-subtle)]">
        Categoría
      </span>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`mobile-filter-dropdown-trigger flex min-h-[48px] w-full items-center justify-between gap-3 rounded-full px-4 text-left ${
          open ? 'mobile-filter-dropdown-trigger--open' : ''
        }`}
      >
        <span
          className={`min-w-0 truncate text-[14px] font-bold ${
            open || categoriaActiva ? 'text-[var(--accent-deep)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[var(--accent-primary)]' : 'text-[var(--text-subtle)]'
          }`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mobile-filter-dropdown-panel mt-2 overflow-hidden"
            role="listbox"
          >
            <div className="mobile-filter-dropdown-search flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
              <Search size={15} className="shrink-0 text-[var(--text-subtle)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría…"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--placeholder)]"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <ul className="mobile-filter-dropdown-list max-h-[min(42dvh,280px)] overflow-y-auto overscroll-contain">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!categoriaActiva}
                  onClick={() => pick('')}
                  className={`mobile-filter-dropdown-option flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                    !categoriaActiva ? 'mobile-filter-dropdown-option--active' : ''
                  }`}
                >
                  <span className="truncate text-[14px]">Todas las categorías</span>
                  {!categoriaActiva ? (
                    <Check size={16} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                  ) : null}
                </button>
              </li>

              {visibleCats.length === 0 ? (
                <li className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  Sin resultados
                </li>
              ) : (
                visibleCats.map(cat => {
                  const subcats = getActiveSubs(cat)
                  const matchingSubs = q
                    ? subcats.filter(s => s.nombre.toLowerCase().includes(q))
                    : subcats
                  const hasSubs = subcats.length > 0
                  const forceExpand = Boolean(q && matchingSubs.length > 0)
                  const isExpanded = forceExpand || expandedSlug === cat.slug
                  const rootActive = categoriaActiva === cat.slug
                  const childActive = subcats.some(s => s.slug === categoriaActiva)

                  if (!hasSubs) {
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={rootActive}
                          onClick={() => pick(cat.slug)}
                          className={`mobile-filter-dropdown-option flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                            rootActive ? 'mobile-filter-dropdown-option--active' : ''
                          }`}
                        >
                          <span className="truncate text-[14px]">{cat.nombre}</span>
                          {rootActive ? (
                            <Check size={16} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                          ) : null}
                        </button>
                      </li>
                    )
                  }

                  return (
                    <li key={cat.id}>
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isExpanded) {
                              toggleExpand(cat.slug)
                              return
                            }
                            pick(cat.slug)
                          }}
                          className={`mobile-filter-dropdown-option flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pl-4 pr-1 text-left ${
                            rootActive || childActive
                              ? 'mobile-filter-dropdown-option--active'
                              : ''
                          }`}
                        >
                          <span className="truncate text-[14px]">{cat.nombre}</span>
                          {rootActive ? (
                            <Check size={16} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                          ) : null}
                        </button>
                        <button
                          type="button"
                          aria-label={
                            isExpanded
                              ? `Ocultar ${cat.nombre}`
                              : `Ver subcategorías de ${cat.nombre}`
                          }
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpand(cat.slug)}
                          className={`flex w-11 shrink-0 items-center justify-center ${
                            isExpanded || childActive
                              ? 'text-[var(--accent-deep)]'
                              : 'text-[var(--text-subtle)]'
                          }`}
                        >
                          <ChevronRight
                            size={16}
                            strokeWidth={1.75}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden border-l border-[var(--border-subtle)] ml-4"
                          >
                            <li>
                              <button
                                type="button"
                                role="option"
                                aria-selected={rootActive}
                                onClick={() => pick(cat.slug)}
                                className={`mobile-filter-dropdown-option flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                                  rootActive ? 'mobile-filter-dropdown-option--active' : ''
                                }`}
                              >
                                <span className="truncate text-[13px]">
                                  Todo {cat.nombre.toLowerCase()}
                                </span>
                                {rootActive ? (
                                  <Check
                                    size={15}
                                    className="shrink-0 text-[var(--accent-primary)]"
                                    strokeWidth={2.5}
                                  />
                                ) : null}
                              </button>
                            </li>
                            {(q ? matchingSubs : subcats).map(sub => {
                              const subActive = categoriaActiva === sub.slug
                              return (
                                <li key={sub.id}>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={subActive}
                                    onClick={() => pick(sub.slug)}
                                    className={`mobile-filter-dropdown-option flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                                      subActive ? 'mobile-filter-dropdown-option--active' : ''
                                    }`}
                                  >
                                    <span className="truncate text-[13px]">{sub.nombre}</span>
                                    {subActive ? (
                                      <Check
                                        size={15}
                                        className="shrink-0 text-[var(--accent-primary)]"
                                        strokeWidth={2.5}
                                      />
                                    ) : null}
                                  </button>
                                </li>
                              )
                            })}
                          </motion.ul>
                        ) : null}
                      </AnimatePresence>
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
