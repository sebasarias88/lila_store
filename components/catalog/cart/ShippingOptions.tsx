'use client'

import { Truck } from 'lucide-react'
import { formatPrecio } from '@/components/catalog/mobile/cart/MobileCartItem'
import { formatShippingDays, type ShippingOption } from '@/lib/shippingShared'
import type { LoadStatus } from '@/lib/useShipping'

/**
 * Carrier choices returned by Mipaquete for the customer's city.
 * Skeletons while quoting; a clear fallback message if the quote fails.
 */
export default function ShippingOptions({
  status,
  options,
  selectedId,
  onSelect,
  fallbackText,
}: {
  status: LoadStatus
  options: ShippingOption[]
  selectedId: string
  onSelect: (id: string) => void
  /** Shown when the quote fails (e.g. "Envío a convenir: te confirmamos el valor por WhatsApp"). */
  fallbackText: string
}) {
  if (status === 'idle') return null

  if (status === 'loading' && !options.length) {
    return (
      <div className="mt-3 space-y-2" aria-busy="true">
        <span role="status" className="sr-only">Calculando envío…</span>
        {[0, 1].map(i => (
          <div
            key={i}
            className="h-[58px] rounded-[18px] border border-[var(--border)] bg-[var(--bg-muted)] motion-safe:animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-[18px] bg-[var(--bg-muted)] px-3.5 py-2.5 text-[12px] font-medium text-[var(--accent-deep)]">
        <Truck size={14} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" aria-hidden />
        {fallbackText}
      </p>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Elige cómo quieres recibir tu pedido"
      aria-busy={status === 'loading' || undefined}
      className={`mt-3 space-y-2 transition-opacity ${status === 'loading' ? 'opacity-60' : ''}`}
    >
      {options.map((option, i) => {
        const selected = option.id === selectedId
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={status === 'loading'}
            onClick={() => onSelect(option.id)}
            className={`flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3 text-left transition-colors ${
              selected
                ? 'border-[var(--accent-primary)] bg-white shadow-[var(--shadow-soft)]'
                : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]/60'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--border)] bg-white'
              }`}
              aria-hidden
            >
              {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-[var(--text-primary)]">
                {option.carrier}
                {i === 0 ? (
                  <span className="ml-2 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-deep)]">
                    Más económico
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-muted)]">
                {formatShippingDays(option.days)}
              </span>
            </span>
            <span className="shrink-0 text-[14px] font-extrabold text-[var(--accent-deep)]">
              {formatPrecio(option.cost)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
