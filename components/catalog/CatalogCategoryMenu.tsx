'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { Categoria } from '@/types'
import CatalogFilterSelect from '@/components/catalog/CatalogFilterSelect'

type Props = {
  categorias: Categoria[]
  categoriaActiva: string
  onChange: (slug: string) => void
}

function getActiveSubs(cat: Categoria): Categoria[] {
  return (cat.subcategorias || [])
    .filter(s => s.activa !== false)
    .sort((a, b) => a.orden - b.orden)
}

export default function CatalogCategoryMenu({
  categorias,
  categoriaActiva,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const label = useMemo(() => {
    if (!categoriaActiva) return 'Categorías'
    for (const cat of categorias) {
      if (cat.slug === categoriaActiva) return cat.nombre
      const sub = cat.subcategorias?.find(s => s.slug === categoriaActiva)
      if (sub) return sub.nombre
    }
    return 'Categorías'
  }, [categorias, categoriaActiva])

  useEffect(() => {
    if (!open) {
      setExpandedSlug(null)
      return
    }
    // Si hay una subcategoría activa, abrir su padre para contexto
    for (const cat of categorias) {
      if (getActiveSubs(cat).some(s => s.slug === categoriaActiva)) {
        setExpandedSlug(cat.slug)
        return
      }
    }
  }, [open, categoriaActiva, categorias])

  const toggleExpand = (slug: string) => {
    setExpandedSlug(prev => (prev === slug ? null : slug))
  }

  const select = (slug: string) => {
    onChange(slug)
    setOpen(false)
  }

  return (
    <CatalogFilterSelect
      label="Categoría"
      valueLabel={label}
      open={open}
      onOpenChange={setOpen}
      active={Boolean(categoriaActiva)}
      panelClassName="w-[min(100vw-2rem,300px)]"
    >
      <button
        type="button"
        role="option"
        aria-selected={!categoriaActiva}
        onClick={() => select('')}
        className={`relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
          !categoriaActiva
            ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        {!categoriaActiva && (
          <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[var(--accent-primary)]" aria-hidden />
        )}
        <span className="truncate text-[13px] font-medium tracking-[0.01em]">
          Todas las categorías
        </span>
        {!categoriaActiva && <Check size={13} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />}
      </button>

      {categorias.map(cat => {
        const subcats = getActiveSubs(cat)
        const hasSubs = subcats.length > 0
        const isExpanded = expandedSlug === cat.slug
        const rootActive = categoriaActiva === cat.slug
        const childActive = subcats.some(s => s.slug === categoriaActiva)

        if (!hasSubs) {
          return (
            <button
              key={cat.id}
              type="button"
              role="option"
              aria-selected={rootActive}
              onClick={() => select(cat.slug)}
              className={`relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                rootActive
                  ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {rootActive && (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[var(--accent-primary)]" aria-hidden />
              )}
              <span className="truncate text-[13px] font-medium tracking-[0.01em]">{cat.nombre}</span>
              {rootActive && <Check size={13} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />}
            </button>
          )
        }

        return (
          <div key={cat.id}>
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={`${cat.nombre}, ${isExpanded ? 'cerrar' : 'ver'} subcategorías`}
              onClick={() => toggleExpand(cat.slug)}
              className={`relative flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${
                rootActive
                  ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                  : childActive || isExpanded
                    ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {(rootActive || childActive) && (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[var(--accent-primary)]" aria-hidden />
              )}
              <span className="truncate text-[13px] font-medium tracking-[0.01em]">{cat.nombre}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {rootActive && <Check size={13} className="text-[var(--accent-primary)]" strokeWidth={2.5} />}
                <ChevronRight
                  size={14}
                  strokeWidth={1.75}
                  className={`transition-transform duration-200 ${
                    isExpanded || childActive
                      ? 'rotate-90 text-[var(--accent-primary)]'
                      : 'text-[var(--text-subtle)]'
                  }`}
                />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <button
                  type="button"
                  role="option"
                  aria-selected={rootActive}
                  onClick={() => select(cat.slug)}
                  className={`relative flex w-full items-center gap-3 py-2 pl-7 pr-4 text-left transition-colors ${
                    rootActive
                      ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {rootActive && (
                    <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-[var(--accent-primary)]" aria-hidden />
                  )}
                  <span className="truncate text-[12px] font-medium">
                    Todo {cat.nombre.toLowerCase()}
                  </span>
                  {rootActive && (
                    <Check size={13} className="ml-auto shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                  )}
                </button>
                {subcats.map(sub => {
                  const subActive = categoriaActiva === sub.slug
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="option"
                      aria-selected={subActive}
                      onClick={() => select(sub.slug)}
                      className={`relative flex w-full items-center gap-3 py-2 pl-7 pr-4 text-left transition-colors ${
                        subActive
                          ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {subActive && (
                        <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-[var(--accent-primary)]" aria-hidden />
                      )}
                      <span className="truncate text-[12px] font-medium">{sub.nombre}</span>
                      {subActive && (
                        <Check size={13} className="ml-auto shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </CatalogFilterSelect>
  )
}
