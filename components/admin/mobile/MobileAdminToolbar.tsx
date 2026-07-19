'use client'

import { Search, X } from 'lucide-react'

type FilterOption<T extends string> = {
  id: T
  label: string
}

type MobileAdminToolbarProps<T extends string> = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: FilterOption<T>[]
  activeFilter: T
  onFilterChange: (id: T) => void
}

export default function MobileAdminToolbar<T extends string>({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeFilter,
  onFilterChange,
}: MobileAdminToolbarProps<T>) {
  return (
    <div className="mobile-admin-toolbar mb-4 space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          type="text"
          inputMode="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="mobile-admin-search w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-[14px] font-light text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[rgba(232,136,181,0.55)]"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--text-muted)]"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
      <div className="mobile-admin-filters -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map(({ id, label }) => {
          const active = activeFilter === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.8px] ${
                active
                  ? 'border-[rgba(232,136,181,0.45)] bg-[rgba(232,136,181,0.14)] text-[var(--accent-primary)]'
                  : 'border-[var(--border-input)] bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
