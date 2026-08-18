'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export type AdminSelectOption = {
  value: string
  label: string
  /** Texto secundario tenue (ej: la categoría padre de una subcategoría). */
  hint?: string
}

export type AdminSelectGroup = {
  label: string
  options: AdminSelectOption[]
}

type DropdownCoords = { top: number; left: number; width: number }

const PANEL_CLASS =
  'overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-dropdown)] md:rounded-[2px]'

const LIST_CLASS = 'max-h-60 overflow-y-auto p-1'

const ITEM_BASE =
  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-light transition-colors md:rounded-[2px]'

const ITEM_IDLE =
  'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'

const ITEM_ACTIVE = 'bg-[var(--gold-muted)] text-[var(--gold)]'

const EMPTY_CLASS = 'px-3 py-3 text-center text-[12px] font-light text-[var(--text-subtle)]'

const GROUP_HEADER_CLASS =
  'flex items-center gap-2 px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--gold)] first:pt-1.5'

function optionMatchesQuery(option: AdminSelectOption, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = `${option.label} ${option.hint ?? ''}`.toLowerCase()
  return haystack.includes(q)
}

function OptionLabel({ option }: { option: AdminSelectOption }) {
  return (
    <span className="min-w-0 truncate">
      {option.label}
      {option.hint ? (
        <span className="text-[var(--text-subtle)]"> · {option.hint}</span>
      ) : null}
    </span>
  )
}

function DropdownSearch({
  value,
  onChange,
  placeholder = 'Buscar…',
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-card)] p-2">
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          placeholder={placeholder}
          className="admin-input w-full rounded-lg border py-2 pl-8 pr-3 text-[12px] md:rounded-[2px]"
          autoComplete="off"
        />
      </div>
    </div>
  )
}

function useAnchoredDropdown<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<DropdownCoords | null>(null)
  const anchorRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    const rect = anchor.getBoundingClientRect()
    const panelHeight = panel.offsetHeight
    const gap = 6
    const padding = 8
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < panelHeight + gap && rect.top > panelHeight + gap

    let top = openUp ? rect.top - panelHeight - gap : rect.bottom + gap
    const width = rect.width
    const left = Math.max(
      padding,
      Math.min(rect.left, window.innerWidth - width - padding),
    )
    top = Math.max(padding, Math.min(top, window.innerHeight - panelHeight - padding))

    setCoords({ top, left, width })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return { open, setOpen, mounted, coords, update, anchorRef, panelRef, rootRef }
}

function panelStyle(coords: DropdownCoords | null): React.CSSProperties {
  return {
    position: 'fixed',
    top: coords?.top ?? 0,
    left: coords?.left ?? 0,
    width: coords?.width ?? undefined,
    opacity: coords ? 1 : 0,
    pointerEvents: coords ? 'auto' : 'none',
    zIndex: 10050,
  }
}

export function AdminSelect({
  value,
  onChange,
  options = [],
  groups,
  placeholder = 'Seleccionar',
  disabled = false,
  className = '',
  searchable = false,
  searchPlaceholder = 'Buscar…',
}: {
  value: string
  onChange: (value: string) => void
  options?: AdminSelectOption[]
  groups?: AdminSelectGroup[]
  placeholder?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const { open, setOpen, mounted, coords, update, anchorRef, panelRef, rootRef } =
    useAnchoredDropdown<HTMLButtonElement>()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const allOptions = groups ? groups.flatMap(g => g.options) : options
  const selected = allOptions.find(o => o.value === value && o.value !== '')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useLayoutEffect(() => {
    if (open) update()
  }, [open, search, update])

  useEffect(() => {
    if (open && searchable) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [open, searchable])

  const filteredOptions = useMemo(
    () => options.filter(o => optionMatchesQuery(o, search)),
    [options, search],
  )

  const filteredGroups = useMemo(
    () =>
      (groups ?? [])
        .map(g => ({
          label: g.label,
          options: g.options.filter(o => optionMatchesQuery(o, search)),
        }))
        .filter(g => g.options.length > 0),
    [groups, search],
  )

  const renderOption = (option: AdminSelectOption) => {
    const active = option.value === value
    return (
      <button
        key={option.value || '__empty'}
        type="button"
        onClick={() => {
          onChange(option.value)
          setOpen(false)
        }}
        className={`${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
      >
        <OptionLabel option={option} />
        {active && <Check size={14} className="shrink-0" />}
      </button>
    )
  }

  const emptyMessage = search.trim() ? 'Sin coincidencias' : 'Sin opciones'

  const panel =
    open && mounted
      ? createPortal(
          <div ref={panelRef} style={panelStyle(coords)} className={PANEL_CLASS}>
            {searchable ? (
              <DropdownSearch
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
                inputRef={searchRef}
              />
            ) : null}
            <div className={LIST_CLASS}>
              {groups ? (
                filteredGroups.length === 0 ? (
                  <p className={EMPTY_CLASS}>{emptyMessage}</p>
                ) : (
                  filteredGroups.map(group => (
                    <div key={group.label}>
                      <p className={GROUP_HEADER_CLASS}>{group.label}</p>
                      {group.options.map(renderOption)}
                    </div>
                  ))
                )
              ) : filteredOptions.length === 0 ? (
                <p className={EMPTY_CLASS}>{emptyMessage}</p>
              ) : (
                filteredOptions.map(renderOption)
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`admin-input flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-3 text-[13px] disabled:cursor-not-allowed md:rounded-[2px] ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate text-left ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--placeholder)]'}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--gold-subtle)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {panel}
    </div>
  )
}

export function AdminMultiSelect({
  values,
  onChange,
  options = [],
  groups,
  placeholder = '+ Agregar',
  emptyLabel = 'No hay más opciones',
  className = '',
  searchable = true,
  searchPlaceholder = 'Buscar categoría…',
}: {
  values: string[]
  onChange: (values: string[]) => void
  options?: AdminSelectOption[]
  groups?: AdminSelectGroup[]
  placeholder?: string
  emptyLabel?: string
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const { open, setOpen, mounted, coords, update, anchorRef, panelRef, rootRef } =
    useAnchoredDropdown<HTMLDivElement>()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const allOptions = groups ? groups.flatMap(g => g.options) : options
  const available = options.filter(o => !values.includes(o.value))
  const availableGroups = (groups ?? [])
    .map(g => ({ label: g.label, options: g.options.filter(o => !values.includes(o.value)) }))
    .filter(g => g.options.length > 0)

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    update()
    // Recalcular tras pintar (el modal/scroll puede mover el ancla).
    const id = window.requestAnimationFrame(() => update())
    return () => window.cancelAnimationFrame(id)
  }, [open, values.length, search, update])

  useEffect(() => {
    if (open && searchable) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 10)
      return () => window.clearTimeout(t)
    }
  }, [open, searchable])

  const filteredAvailable = useMemo(
    () => available.filter(o => optionMatchesQuery(o, search)),
    [available, search],
  )

  const filteredGroups = useMemo(
    () =>
      availableGroups
        .map(g => ({
          label: g.label,
          options: g.options.filter(o => optionMatchesQuery(o, search)),
        }))
        .filter(g => g.options.length > 0),
    [availableGroups, search],
  )

  const renderOption = (option: AdminSelectOption) => (
    <button
      key={option.value}
      type="button"
      onClick={() => onChange([...values, option.value])}
      className={`${ITEM_BASE} ${ITEM_IDLE}`}
    >
      <OptionLabel option={option} />
    </button>
  )

  const emptyMessage = search.trim() ? 'Sin coincidencias' : emptyLabel

  const panel =
    open && mounted
      ? createPortal(
          <div ref={panelRef} style={panelStyle(coords)} className={PANEL_CLASS}>
            <div className={LIST_CLASS}>
              {groups ? (
                filteredGroups.length === 0 ? (
                  <p className={EMPTY_CLASS}>{emptyMessage}</p>
                ) : (
                  filteredGroups.map(group => (
                    <div key={group.label}>
                      <p className={GROUP_HEADER_CLASS}>{group.label}</p>
                      {group.options.map(renderOption)}
                    </div>
                  ))
                )
              ) : filteredAvailable.length === 0 ? (
                <p className={EMPTY_CLASS}>{emptyMessage}</p>
              ) : (
                filteredAvailable.map(renderOption)
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={anchorRef}
        className={`admin-input w-full rounded-xl border px-3 py-2.5 md:rounded-[2px] ${className}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(v => !v)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(v => !v)
            }
          }}
          className="flex min-h-[32px] w-full cursor-pointer flex-wrap items-center gap-2"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {values.length === 0 && !open && (
            <span className="text-[13px] text-[var(--placeholder)]">{placeholder}</span>
          )}

          {values.map(value => {
            const option = allOptions.find(o => o.value === value)
            if (!option) return null
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] py-0.5 pl-2.5 pr-1.5 text-[11px] font-light text-[var(--gold)]"
              >
                {option.label}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onChange(values.filter(v => v !== value))
                  }}
                  aria-label={`Quitar ${option.label}`}
                  className="inline-flex items-center justify-center rounded-full text-[color-mix(in_srgb,var(--gold)_75%,transparent)] transition-colors hover:bg-[rgba(201,168,76,0.18)] hover:text-[var(--gold)]"
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}

          <ChevronDown
            size={14}
            className={`ml-auto shrink-0 text-[var(--gold-subtle)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Buscador siempre visible al abrir (no solo en el portal). */}
        {open && searchable ? (
          <div
            className="mt-2 flex items-center gap-2 border-t border-[var(--border)] pt-2"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <Search size={14} className="shrink-0 text-[var(--text-subtle)]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--placeholder)]"
              autoComplete="off"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 rounded-full p-0.5 text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
                aria-label="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {panel}
    </div>
  )
}
