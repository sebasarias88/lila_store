'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'

export type FilterOption = {
  value: string
  label: string
  hint?: string
}

type MobileFilterDropdownProps = {
  label: string
  value?: string
  options: FilterOption[]
  onChange?: (value: string) => void
  /** Multiselect: mantiene el panel abierto al elegir */
  multiple?: boolean
  values?: string[]
  onValuesChange?: (values: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  searchable?: boolean
  searchPlaceholder?: string
  /** Clase opcional para limitar alto de la lista (ej. orden compacto) */
  listClassName?: string
}

export default function MobileFilterDropdown({
  label,
  value = '',
  options,
  onChange,
  multiple = false,
  values = [],
  onValuesChange,
  open,
  onOpenChange,
  searchable = false,
  searchPlaceholder = 'Buscar…',
  listClassName = 'max-h-[min(50dvh,280px)]',
}: MobileFilterDropdownProps) {
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)
  const hasMulti = multiple && values.length > 0

  const displayLabel = multiple
    ? values.length === 0
      ? (options.find(o => o.value === '')?.label ?? 'Todas')
      : values.length === 1
        ? values[0]
        : `${values.length} marcas`
    : (selected?.label ?? 'Seleccionar')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      o =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q),
    )
  }, [options, search])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onOpenChange])

  const pick = (next: string) => {
    if (multiple && onValuesChange) {
      if (!next) {
        onValuesChange([])
        return
      }
      if (values.includes(next)) {
        onValuesChange(values.filter(v => v !== next))
      } else {
        onValuesChange([...values, next])
      }
      return
    }
    onChange?.(next)
    onOpenChange(false)
  }

  return (
    <div ref={rootRef} className="mobile-filter-dropdown relative">
      <span className="mb-2 block text-[11px] font-bold text-[var(--text-subtle)]">
        {label}
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
            open || hasMulti || (value && value !== options[0]?.value)
              ? 'text-[var(--accent-deep)]'
              : 'text-[var(--text-primary)]'
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
            aria-multiselectable={multiple || undefined}
          >
            {searchable ? (
              <div className="mobile-filter-dropdown-search flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
                <Search size={15} className="shrink-0 text-[var(--text-subtle)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--placeholder)]"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            ) : null}

            <ul
              className={`mobile-filter-dropdown-list overflow-y-auto overscroll-contain ${listClassName}`}
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  Sin resultados
                </li>
              ) : (
                filtered.map(option => {
                  const active = multiple
                    ? option.value === ''
                      ? values.length === 0
                      : values.includes(option.value)
                    : option.value === value
                  return (
                    <li key={option.value || '__all__'}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => pick(option.value)}
                        className={`mobile-filter-dropdown-option flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                          active ? 'mobile-filter-dropdown-option--active' : ''
                        }`}
                      >
                        <span className="min-w-0">
                          {option.hint ? (
                            <span className="block truncate text-[11px] text-[var(--text-subtle)]">
                              {option.hint}
                            </span>
                          ) : null}
                          <span className="block truncate text-[14px]">{option.label}</span>
                        </span>
                        {active ? (
                          <Check size={16} className="shrink-0 text-[var(--accent-primary)]" strokeWidth={2.5} />
                        ) : null}
                      </button>
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
