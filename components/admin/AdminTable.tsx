'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ImageIcon, Pencil, Trash2, Tag, Hash, MoreVertical, Search, X, ChevronLeft, ChevronRight, CornerDownRight } from 'lucide-react'
import { ReactNode, useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  getPaginationBounds,
  getPaginationRange,
  getTotalPages,
} from '@/lib/pagination'

/* ── Wrapper ── */

export function AdminTableShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[rgba(169,137,224,0.55)] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(169,137,224,0.05),transparent_55%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

export function AdminTable({
  children,
  minWidth = '920px',
  fixed = false,
  footer,
}: {
  children: ReactNode
  minWidth?: string
  fixed?: boolean
  footer?: ReactNode
}) {
  return (
    <AdminTableShell>
      <div className="admin-table-scroll min-w-0 overflow-x-auto overscroll-x-contain">
        <table
          className={fixed ? 'table-fixed' : undefined}
          style={{ minWidth, width: `max(100%, ${minWidth})` }}
        >
          {children}
        </table>
      </div>
      {footer}
    </AdminTableShell>
  )
}

/* ── Head ── */

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="admin-table-head sticky top-0 z-10 border-b border-[var(--border-card)] bg-[var(--admin-table-head-bg,var(--bg-muted))] backdrop-blur-sm">
      {children}
    </thead>
  )
}

export function AdminTableHeaderRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-[var(--border-card)]">
      {children}
    </tr>
  )
}

export function AdminTableTh({
  children,
  className = '',
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <th
      className={`px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent-deep)] ${className}`}
    >
      {children}
    </th>
  )
}

/* ── Body ── */

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function AdminTableRow({
  children,
  index = 0,
  animated = true,
  className = '',
}: {
  children: ReactNode
  index?: number
  animated?: boolean
  className?: string
}) {
  const rowClass =
    `admin-table-row group relative border-b border-[var(--border)] transition-all duration-200 hover:bg-[rgba(169,137,224,0.07)] hover:shadow-[inset_3px_0_0_var(--accent-primary)] ${className}`.trim()

  if (!animated) {
    return <tr className={rowClass}>{children}</tr>
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      className={rowClass}
    >
      {children}
    </motion.tr>
  )
}

/** Título de sección con divisor dorado */
export function AdminSectionTitle({
  title,
  action,
  className = '',
}: {
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-5 flex min-h-[28px] items-center justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-px max-w-[32px] flex-1 bg-gradient-to-r from-[rgba(169,137,224,0.5)] to-transparent" />
        <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[2.5px] text-[var(--accent-primary)]">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[rgba(169,137,224,0.2)] to-transparent" />
      </div>
      <div className="flex min-w-[4.5rem] shrink-0 items-center justify-end">
        {action ?? null}
      </div>
    </div>
  )
}

export function AdminTableTd({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td className={`overflow-hidden px-5 py-4 align-middle ${className}`}>
      {children}
    </td>
  )
}

/** Toolbar de búsqueda + filtros para listados admin */
export function AdminListToolbar<T extends string>({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeFilter,
  onFilterChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: { id: T; label: string }[]
  activeFilter: T
  onFilterChange: (id: T) => void
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
      <div className="relative min-w-0 flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full border-0 border-b border-[var(--border-input)] bg-transparent py-3 pl-7 pr-8 text-[13px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--placeholder)] focus:border-[rgba(169,137,224,0.55)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--accent-secondary)]"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:min-w-[20rem]">
        {filters.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`h-10 rounded-xl border px-3 text-[10px] uppercase tracking-[1.4px] transition-all ${
              activeFilter === f.id
                ? 'border-[rgba(169,137,224,0.5)] bg-[rgba(169,137,224,0.12)] text-[var(--accent-secondary)] shadow-[0_0_12px_rgba(169,137,224,0.08)]'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[rgba(169,137,224,0.32)] hover:text-[var(--accent-secondary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Contador bajo el toolbar */
export function AdminListMeta({
  count,
  noun,
  search,
  activeFilterLabel,
}: {
  count: number
  noun: string
  search?: string
  activeFilterLabel?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-[rgba(169,137,224,0.12)] pb-3">
      <p className="text-[12px] uppercase tracking-[1px] text-[var(--text-muted)]">
        {count} {noun}
        {count !== 1 ? 's' : ''}
        {search ? ` para "${search}"` : ''}
      </p>
      {activeFilterLabel && (
        <span className="text-[11px] text-[var(--accent-secondary)]">
          Filtro: {activeFilterLabel}
        </span>
      )}
    </div>
  )
}

/* ── Empty state ── */

export function AdminTableEmpty({
  icon: Icon,
  title,
  description,
  action,
  colSpan,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  colSpan: number
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 scale-150 rounded-full bg-[rgba(169,137,224,0.12)] blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-[rgba(169,137,224,0.3)] bg-[rgba(169,137,224,0.1)] shadow-[0_0_24px_rgba(169,137,224,0.15)]">
              <Icon size={24} className="text-[var(--accent-secondary)]" />
            </div>
          </div>
          <p className="text-[15px] tracking-[0.3px] text-[var(--text-primary)]">{title}</p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
          {action && <div className="mt-6">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

/* ── Cells ── */

export function AdminTableImage({
  src,
  alt,
  size = 'md',
}: {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'row'
}) {
  const dim =
    size === 'sm' ? 'h-10 w-10' : size === 'row' ? 'h-11 w-11' : 'h-12 w-12'
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl ${dim} ring-1 ring-[rgba(169,137,224,0.25)] shadow-[0_4px_16px_rgba(0,0,0,0.3)]`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full bg-white object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-muted)]">
          <ImageIcon size={16} className="text-[rgba(169,137,224,0.45)]" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.15)] to-transparent" />
    </div>
  )
}

export function AdminTablePrimary({
  title,
  subtitle,
  indent,
}: {
  title: string
  subtitle?: string
  indent?: boolean
}) {
  return (
    <div className={indent ? 'pl-3 border-l-2 border-[rgba(169,137,224,0.25)]' : ''}>
      <p className="truncate text-[14px] font-semibold tracking-[0.2px] text-[var(--text-primary)]" title={title}>
        {title}
      </p>
      {subtitle && (
        <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function AdminTableBadge({
  children,
  variant = 'gold',
}: {
  children: ReactNode
  variant?: 'gold' | 'muted' | 'code'
}) {
  const styles = {
    gold: 'border-[rgba(169,137,224,0.3)] bg-[rgba(169,137,224,0.1)] text-[var(--accent-deep)]',
    muted: 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)]',
    code: 'border-[rgba(169,137,224,0.22)] bg-[rgba(169,137,224,0.06)] text-[var(--accent-deep)] font-mono',
  }
  return (
    <span
      className={`inline-block max-w-[160px] truncate rounded-xl border px-2.5 py-1 text-[10px] uppercase tracking-[1px] ${styles[variant]}`}
    >
      {children}
    </span>
  )
}

/**
 * Categoría en tabla de productos — pill con icono.
 * Si recibe `parent`, se trata de una subcategoría y se muestra el
 * breadcrumb "Padre › Sub" con un estilo distinto + etiqueta inferior,
 * para diferenciar visualmente categoría de subcategoría.
 */
export function AdminTableCategory({
  name,
  parent,
}: {
  name: string
  parent?: string | null
}) {
  const isSub = Boolean(parent)

  return (
    <div
      className={`inline-flex max-w-[220px] items-center gap-2.5 rounded-full border py-1 pl-1 pr-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-colors ${
        isSub
          ? 'border-[rgba(96,165,250,0.22)] bg-gradient-to-r from-[rgba(96,165,250,0.1)] via-[rgba(96,165,250,0.04)] to-transparent group-hover:border-[rgba(96,165,250,0.4)]'
          : 'border-[rgba(169,137,224,0.22)] bg-gradient-to-r from-[rgba(169,137,224,0.1)] via-[rgba(169,137,224,0.04)] to-transparent group-hover:border-[rgba(169,137,224,0.35)]'
      }`}
      title={isSub ? `${parent} › ${name}` : name}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${
          isSub
            ? 'bg-[rgba(96,165,250,0.14)] ring-[rgba(96,165,250,0.3)]'
            : 'bg-[rgba(169,137,224,0.14)] ring-[rgba(169,137,224,0.28)]'
        }`}
      >
        {isSub ? (
          <CornerDownRight size={12} className="text-blue-400" strokeWidth={1.75} />
        ) : (
          <Tag size={12} className="text-[var(--accent-secondary)]" strokeWidth={1.5} />
        )}
      </span>

      <span className="flex min-w-0 items-center gap-1 text-[12px] tracking-[0.2px]">
        {isSub && (
          <>
            <span className="max-w-[80px] shrink-0 truncate text-[var(--text-faint)]">
              {parent}
            </span>
            <ChevronRight size={11} className="shrink-0 text-[var(--text-faint)]" strokeWidth={1.5} />
          </>
        )}
        <span className="truncate text-[var(--text-primary)]">{name}</span>
      </span>
    </div>
  )
}

export function AdminTableCategoryEmpty() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] italic text-[var(--text-faint)]">
      <span className="h-px w-4 bg-[rgba(248,246,241,0.12)]" />
      Sin categoría
    </span>
  )
}

/** Slug en tabla de categorías — pill alineado al estilo de categoría en productos */
export function AdminTableSlug({ slug, className = '' }: { slug: string; className?: string }) {
  return (
    <div
      className={`inline-flex max-w-[220px] items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-gradient-to-r from-[rgba(248,246,241,0.05)] via-transparent to-transparent py-1 pl-1 pr-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(248,246,241,0.05)] transition-colors group-hover:border-[rgba(169,137,224,0.28)] ${className}`}
      title={slug}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(248,246,241,0.04)] ring-1 ring-[rgba(248,246,241,0.1)]">
        <Hash size={11} className="text-[rgba(169,137,224,0.6)]" strokeWidth={1.75} />
      </span>
      <span className="truncate text-[12px] tracking-[0.15px] text-[var(--text-primary)]">
        {slug}
      </span>
    </div>
  )
}

export function AdminTablePrice({
  value,
  previous,
  tone = 'detal',
}: {
  value: string
  previous?: string | null
  tone?: 'detal' | 'mayoreo' | 'muted'
}) {
  const colors = {
    detal: 'text-[var(--accent-secondary)]',
    mayoreo: 'text-[var(--accent-primary-hover)]',
    muted: 'text-[var(--text-faint)]',
  }
  return (
    <div className="space-y-0.5">
      <p className={`text-[13px] tabular-nums ${colors[tone]}`}>{value}</p>
      {previous && (
        <p className="text-[11px] tabular-nums text-[var(--text-faint)] line-through">
          {previous}
        </p>
      )}
    </div>
  )
}

export function AdminTableNumber({ value }: { value: number | string }) {
  const padded = String(value).padStart(2, '0')
  return (
    <div className="inline-flex items-center gap-2.5" title={`Orden: ${value}`}>
      <span className="h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-[rgba(169,137,224,0.55)] to-transparent" />
      <span className="text-[15px] tabular-nums tracking-[0.05em] text-[var(--text-primary)]">
        {padded}
      </span>
    </div>
  )
}

type StatusVariant = 'success' | 'danger' | 'neutral' | 'gold'

export function AdminTableStatus({
  label,
  icon: Icon,
  variant,
  onClick,
  title,
  iconClassName,
}: {
  label: string
  icon: LucideIcon
  variant: StatusVariant
  onClick?: () => void
  title?: string
  iconClassName?: string
}) {
  const styles: Record<StatusVariant, string> = {
    success:
      'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.08)]',
    danger:
      'border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] text-red-400 shadow-[0_0_12px_rgba(248,113,113,0.08)]',
    neutral:
      'border-[var(--border-input)] bg-[var(--bg-muted)] text-[var(--text-muted)]',
    gold: 'border-[rgba(169,137,224,0.35)] bg-[rgba(169,137,224,0.12)] text-[var(--accent-secondary)] shadow-[0_0_12px_rgba(169,137,224,0.1)]',
  }
  const iconColors: Record<StatusVariant, string> = {
    success: 'text-emerald-400',
    danger: 'text-red-400',
    neutral: 'text-[var(--text-muted)]',
    gold: 'text-[var(--accent-secondary)]',
  }

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all ${styles[variant]} ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      <Icon size={12} className={`${iconColors[variant]} ${iconClassName ?? ''}`} />
      <span className="text-[10px] uppercase tracking-[1px]">{label}</span>
    </Tag>
  )
}

export function AdminTableActions({
  onEdit,
  onDelete,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}: {
  onEdit: () => void
  onDelete: () => void
  editLabel?: string
  deleteLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateMenuPosition = () => {
    const trigger = buttonRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const menuWidth = menu.offsetWidth
    const gap = 6
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuHeight + gap

    let top = openUp ? rect.top - menuHeight - gap : rect.bottom + gap
    let left = rect.right - menuWidth

    const padding = 8
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding))

    setMenuCoords({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuCoords(null)
      return
    }

    updateMenuPosition()

    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
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

  const menu = open && mounted ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: menuCoords?.top ?? -9999,
        left: menuCoords?.left ?? -9999,
        visibility: menuCoords ? 'visible' : 'hidden',
        zIndex: 9999,
      }}
      className="min-w-[10.5rem] overflow-hidden rounded-xl border border-[rgba(169,137,224,0.22)] bg-[var(--bg-muted)] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setOpen(false)
          onEdit()
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] text-[var(--text-primary)] transition-colors hover:bg-[rgba(169,137,224,0.1)] hover:text-[var(--accent-secondary)]"
      >
        <Pencil size={14} className="shrink-0 text-[rgba(169,137,224,0.65)]" />
        {editLabel}
      </button>
      <div className="mx-3 h-px bg-[rgba(169,137,224,0.1)]" />
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setOpen(false)
          onDelete()
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] text-[var(--text-primary)] transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-red-400"
      >
        <Trash2 size={14} className="shrink-0 text-red-400/70" />
        {deleteLabel}
      </button>
    </div>
  ) : null

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
          open
            ? 'border-[rgba(169,137,224,0.45)] bg-[rgba(169,137,224,0.12)] text-[var(--accent-secondary)]'
            : 'border-transparent text-[var(--text-subtle)] hover:border-[rgba(169,137,224,0.25)] hover:bg-[rgba(169,137,224,0.08)] hover:text-[var(--accent-secondary)]'
        }`}
        aria-label="Acciones"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={16} strokeWidth={1.5} />
      </button>

      {menu && createPortal(menu, document.body)}
    </div>
  )
}

export function AdminTableSkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="admin-table-row border-b border-[var(--border-card)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3 animate-pulse rounded-xl bg-[var(--bg-muted)]"
            style={{ width: i === 0 ? '48px' : `${60 + (i % 3) * 20}%`, maxWidth: '140px' }}
          />
        </td>
      ))}
    </tr>
  )
}

export function AdminTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  compact = false,
}: {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  compact?: boolean
}) {
  const totalPages = getTotalPages(totalItems, pageSize)
  if (totalItems === 0 || totalPages <= 1) return null

  const { start, end } = getPaginationBounds(page, pageSize, totalItems)
  const pages = getPaginationRange(page, totalPages)

  const goTo = (next: number) => {
    onPageChange(Math.min(Math.max(1, next), totalPages))
  }

  const navBtnClass =
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 text-[10px] uppercase tracking-[1.4px] text-[var(--text-muted)] transition-all hover:border-[rgba(169,137,224,0.4)] hover:bg-[rgba(169,137,224,0.1)] hover:text-[var(--accent-secondary)] hover:shadow-[0_0_16px_rgba(169,137,224,0.08)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[var(--border-subtle)] disabled:hover:bg-[var(--bg-muted)] disabled:hover:text-[var(--text-muted)] disabled:hover:shadow-none'

  const pageBtnClass = (active: boolean) =>
    `inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-[12px] tabular-nums transition-all ${
      active
        ? 'border-[rgba(169,137,224,0.5)] bg-gradient-to-b from-[rgba(169,137,224,0.18)] to-[rgba(169,137,224,0.08)] text-[var(--accent-secondary)] shadow-[0_0_0_1px_rgba(169,137,224,0.12),0_4px_16px_rgba(169,137,224,0.12)]'
        : 'border-transparent text-[var(--text-muted)] hover:border-[rgba(169,137,224,0.28)] hover:bg-[rgba(169,137,224,0.08)] hover:text-[var(--accent-secondary)]'
    }`

  return (
    <nav
      className={
        compact
          ? 'flex flex-col items-center gap-3 pt-3'
          : 'flex flex-col gap-4 border-t border-[rgba(169,137,224,0.16)] bg-[rgba(169,137,224,0.04)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'
      }
      aria-label="Paginación de tabla"
    >
      <p
        className={`text-[12px] font-light tracking-[0.02em] text-[var(--text-muted)] ${
          compact ? 'w-full text-center text-[11px]' : ''
        }`}
      >
        Mostrando{' '}
        <span className="font-normal text-[var(--text-primary)]">
          {start}–{end}
        </span>{' '}
        de <span className="font-normal text-[var(--accent-secondary)]">{totalItems}</span>
      </p>

      <div className={`flex items-center gap-1.5 ${compact ? 'justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className={navBtnClass}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          {!compact && <span>Anterior</span>}
        </button>

        <div className="flex items-center gap-1 px-0.5" role="list">
          {pages.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 min-w-7 items-center justify-center text-[13px] text-[var(--text-faint)] select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                role="listitem"
                onClick={() => goTo(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={pageBtnClass(item === page)}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className={navBtnClass}
          aria-label="Página siguiente"
        >
          {!compact && <span>Siguiente</span>}
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  )
}
