'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

type CatalogFilterSelectProps = {
  /** Accesible / title; no se muestra encima del trigger */
  label: string
  valueLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  active?: boolean
  align?: 'left' | 'right'
  panelClassName?: string
  children: React.ReactNode
}

/** Trigger + panel de filtro: pill redondeado estilo kawaii. */
export default function CatalogFilterSelect({
  label,
  valueLabel,
  open,
  onOpenChange,
  active = false,
  align = 'left',
  panelClassName = 'w-[min(100vw-2rem,280px)]',
  children,
}: CatalogFilterSelectProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open, onOpenChange])

  return (
    <div ref={ref} className="relative w-[10.5rem] shrink-0 sm:w-[12rem]">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={label}
        className={`group flex h-11 w-full items-center justify-between gap-2 rounded-full border px-3.5 transition-all ${
          open || active
            ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)] shadow-[var(--shadow-soft)]'
            : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border))] hover:bg-[var(--bg-muted)]'
        }`}
      >
        <span className="truncate text-[13px] font-bold tracking-[0.01em]">
          {valueLabel}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`shrink-0 transition-transform duration-200 ${
            open || active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-subtle)]'
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
            aria-label={label}
            className={`absolute top-[calc(100%+0.5rem)] z-[100] max-h-[min(70vh,400px)] overflow-y-auto rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] py-2 shadow-[var(--shadow-dropdown)] ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${panelClassName}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type CatalogFilterOptionProps = {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  hint?: string
  meta?: React.ReactNode
  inset?: boolean
}

export function CatalogFilterOption({
  active = false,
  onClick,
  children,
  hint,
  meta,
  inset = false,
}: CatalogFilterOptionProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors ${
        inset ? 'pl-7 pr-4' : 'px-4'
      } ${
        active
          ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      {active && (
        <span
          className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[var(--accent-primary)]"
          aria-hidden
        />
      )}
      <span className="min-w-0">
        {hint ? (
          <span className="mb-0.5 block truncate text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--text-faint)]">
            {hint}
          </span>
        ) : null}
        <span className={`block truncate text-[13px] font-medium ${inset ? '' : 'tracking-[0.01em]'}`}>
          {children}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {meta}
        {active && <Check size={13} className="text-[var(--accent-primary)]" strokeWidth={2.5} />}
      </span>
    </button>
  )
}

export function CatalogFilterSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--text-faint)]">
      {children}
    </p>
  )
}
