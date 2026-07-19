'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Categoria } from '@/types'
import { ChevronDown, X } from 'lucide-react'

type CategoriasFilterProps = {
  categorias: Categoria[]
  categoriaActiva: string
  onChange: (slug: string) => void
}

export default function CategoriasFilter({
  categorias,
  categoriaActiva,
  onChange,
}: CategoriasFilterProps) {
  const [expandedCats, setExpandedCats] = useState<string[]>([])

  // Auto-expand the root that owns the active subcategory
  useEffect(() => {
    if (!categoriaActiva) return
    const parent = categorias.find(
      c =>
        c.slug === categoriaActiva ||
        c.subcategorias?.some(s => s.slug === categoriaActiva),
    )
    if (!parent) return
    setExpandedCats(prev =>
      prev.includes(parent.id) ? prev : [...prev, parent.id],
    )
  }, [categoriaActiva, categorias])

  const toggleExpanded = (catId: string) => {
    setExpandedCats(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId],
    )
  }

  return (
    <nav aria-label="Filtrar por categoría" className="sticky top-28">
      <p className="mb-4 text-[9px] font-light uppercase tracking-[3px] text-[var(--gold)]">
        Categorías
      </p>

      <button
        type="button"
        onClick={() => onChange('')}
        className={`flex w-full items-center justify-between border-b border-[var(--border-subtle)] py-2.5 text-[12px] font-light transition-colors ${
          !categoriaActiva
            ? 'text-[var(--gold)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span>Todos los productos</span>
        {!categoriaActiva && (
          <div className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
        )}
      </button>

      {categorias.map(cat => {
        const subcats = (cat.subcategorias || []).filter(s => s.activa !== false)
        const isExpanded = expandedCats.includes(cat.id)
        const rootActive = categoriaActiva === cat.slug
        const childActive = subcats.some(s => s.slug === categoriaActiva)

        return (
          <div key={cat.id} className="border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => onChange(cat.slug)}
                className={`flex flex-1 items-center justify-between py-2.5 text-left text-[12px] font-light transition-colors ${
                  rootActive || childActive
                    ? 'text-[var(--gold)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="truncate">{cat.nombre}</span>
                {rootActive && (
                  <div className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                )}
              </button>

              {subcats.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(cat.id)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Ocultar subcategorías de ${cat.nombre}`
                      : `Ver subcategorías de ${cat.nombre}`
                  }
                  className="p-1 text-[var(--text-faint)] transition-colors hover:text-[var(--gold)]"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && subcats.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pb-2 pl-3"
                >
                  {subcats.map(sub => {
                    const activa = categoriaActiva === sub.slug
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onChange(sub.slug)}
                        className={`flex w-full items-center gap-2 py-2 text-left text-[11px] font-light transition-colors ${
                          activa
                            ? 'text-[var(--gold)]'
                            : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="shrink-0 text-[color-mix(in_srgb,var(--gold)_30%,transparent)]">└</span>
                        <span className="truncate">{sub.nombre}</span>
                        {activa && (
                          <div className="ml-auto h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                        )}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {categoriaActiva && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-4 flex items-center gap-2 text-[10px] font-light uppercase tracking-[1px] text-red-500 transition-colors hover:text-red-600"
        >
          <X size={10} />
          Limpiar filtro
        </button>
      )}
    </nav>
  )
}
