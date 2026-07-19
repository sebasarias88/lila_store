'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'

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
  'max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 shadow-[var(--shadow-dropdown)] md:rounded-[2px]'

const ITEM_BASE =
  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-light transition-colors md:rounded-[2px]'

const ITEM_IDLE =
  'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'

const ITEM_ACTIVE = 'bg-[var(--gold-muted)] text-[var(--gold)]'

const EMPTY_CLASS = 'px-3 py-3 text-center text-[12px] font-light text-[var(--text-subtle)]'

const GROUP_HEADER_CLASS =
  'flex items-center gap-2 px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--gold)] first:pt-1.5'

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
    top: coords?.top ?? -9999,
    left: coords?.left ?? -9999,
    width: coords?.width,
    visibility: coords ? 'visible' : 'hidden',
    zIndex: 9999,
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
}: {
  value: string
  onChange: (value: string) => void
  options?: AdminSelectOption[]
  groups?: AdminSelectGroup[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const { open, setOpen, mounted, coords, anchorRef, panelRef, rootRef } =
    useAnchoredDropdown<HTMLButtonElement>()

  const allOptions = groups ? groups.flatMap(g => g.options) : options
  const selected = allOptions.find(o => o.value === value && o.value !== '')

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

  const groupsWithItems = groups?.filter(g => g.options.length > 0) ?? []

  const panel =
    open && mounted
      ? createPortal(
          <div ref={panelRef} style={panelStyle(coords)} className={PANEL_CLASS}>
            {groups ? (
              groupsWithItems.length === 0 ? (
                <p className={EMPTY_CLASS}>Sin opciones</p>
              ) : (
                groupsWithItems.map(group => (
                  <div key={group.label}>
                    <p className={GROUP_HEADER_CLASS}>{group.label}</p>
                    {group.options.map(renderOption)}
                  </div>
                ))
              )
            ) : options.length === 0 ? (
              <p className={EMPTY_CLASS}>Sin opciones</p>
            ) : (
              options.map(renderOption)
            )}
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
}: {
  values: string[]
  onChange: (values: string[]) => void
  options?: AdminSelectOption[]
  groups?: AdminSelectGroup[]
  placeholder?: string
  emptyLabel?: string
  className?: string
}) {
  const { open, setOpen, mounted, coords, update, anchorRef, panelRef, rootRef } =
    useAnchoredDropdown<HTMLDivElement>()

  const allOptions = groups ? groups.flatMap(g => g.options) : options
  const available = options.filter(o => !values.includes(o.value))
  const availableGroups = (groups ?? [])
    .map(g => ({ label: g.label, options: g.options.filter(o => !values.includes(o.value)) }))
    .filter(g => g.options.length > 0)

  useLayoutEffect(() => {
    if (open) update()
  }, [open, values.length, update])

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

  const panel =
    open && mounted
      ? createPortal(
          <div ref={panelRef} style={panelStyle(coords)} className={PANEL_CLASS}>
            {groups ? (
              availableGroups.length === 0 ? (
                <p className={EMPTY_CLASS}>{emptyLabel}</p>
              ) : (
                availableGroups.map(group => (
                  <div key={group.label}>
                    <p className={GROUP_HEADER_CLASS}>{group.label}</p>
                    {group.options.map(renderOption)}
                  </div>
                ))
              )
            ) : available.length === 0 ? (
              <p className={EMPTY_CLASS}>{emptyLabel}</p>
            ) : (
              available.map(renderOption)
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={anchorRef}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(v => !v)
          }
        }}
        className={`admin-input flex min-h-[48px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 md:rounded-[2px] ${className}`}
      >
        {values.length === 0 && (
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
      {panel}
    </div>
  )
}
