'use client'

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Loader2, MapPin } from 'lucide-react'
import type { ShippingCity } from '@/lib/shippingShared'
import type { LoadStatus } from '@/lib/useShipping'

const MAX_RESULTS = 40

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export const cityLabel = (c: ShippingCity) => (c.department ? `${c.name}, ${c.department}` : c.name)

/**
 * Searchable city picker (no native <select>). Typing filters Colombian
 * municipalities without accents ("bogota" finds "Bogotá"); choosing one sets
 * its DANE code, which the shipping quote needs. If the list can't load, it
 * works as a plain text field so the checkout is never blocked.
 */
export default function CitySelect({
  id,
  value,
  selectedCode,
  status,
  cities,
  onChange,
  inputClassName,
  placeholder = 'Escribe tu ciudad…',
  invalid = false,
}: {
  id?: string
  value: string
  selectedCode: string
  status: LoadStatus
  cities: ShippingCity[]
  onChange: (next: { name: string; code: string }) => void
  inputClassName: string
  placeholder?: string
  invalid?: boolean
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = normalize(value)
    if (!q || status !== 'ready') return []
    const starts: ShippingCity[] = []
    const contains: ShippingCity[] = []
    for (const city of cities) {
      const name = normalize(city.name)
      if (name.startsWith(q)) starts.push(city)
      else if (name.includes(q) || normalize(cityLabel(city)).includes(q)) contains.push(city)
      if (starts.length >= MAX_RESULTS) break
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS)
  }, [value, cities, status])

  const showList = open && status === 'ready' && value.trim().length > 0 && !selectedCode

  const choose = (city: ShippingCity) => {
    onChange({ name: cityLabel(city), code: city.code })
    setOpen(false)
  }

  const scrollActiveIntoView = (index: number) => {
    const el = listRef.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList || !results.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next =
        e.key === 'ArrowDown' ? Math.min(results.length - 1, active + 1) : Math.max(0, active - 1)
      setActive(next)
      scrollActiveIntoView(next)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder={status === 'loading' ? 'Cargando ciudades…' : placeholder}
        onChange={e => {
          onChange({ name: e.target.value, code: '' })
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`${inputClassName} pr-10`}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent-primary)]">
        {status === 'loading' ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : selectedCode ? (
          <Check size={16} aria-hidden />
        ) : (
          <MapPin size={16} aria-hidden />
        )}
      </span>
      {status === 'loading' ? <span role="status" className="sr-only">Cargando ciudades…</span> : null}

      {showList ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-[18px] border border-[var(--border)] bg-white p-1.5 shadow-[0_18px_40px_-16px_rgba(110,79,168,0.35)]"
        >
          {results.length ? (
            results.map((city, i) => (
              <li
                key={city.code}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown (not click) so the input's blur doesn't close the list first
                onMouseDown={e => {
                  e.preventDefault()
                  choose(city)
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer rounded-[12px] px-3 py-2.5 text-[13px] ${
                  i === active ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]' : 'text-[var(--text-primary)]'
                }`}
              >
                <span className="font-bold">{city.name}</span>
                {city.department ? (
                  <span className="ml-1.5 text-[12px] font-medium text-[var(--text-muted)]">{city.department}</span>
                ) : null}
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-[13px] font-medium text-[var(--text-muted)]">
              No encontramos esa ciudad. Revisa cómo la escribiste.
            </li>
          )}
        </ul>
      ) : null}
    </div>
  )
}
