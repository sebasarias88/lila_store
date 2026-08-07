'use client'

import type { MetodoPagoOpcion } from '@/lib/payment-methods'

type MetodoPagoPickerProps = {
  metodos: MetodoPagoOpcion[]
  selected: string
  error?: string
  onSelect: (label: string) => void
  /** Estilo más compacto para mobile */
  compact?: boolean
}

export default function MetodoPagoPicker({
  metodos,
  selected,
  error,
  onSelect,
  compact = false,
}: MetodoPagoPickerProps) {
  if (compact) {
    return (
      <div>
        <div className="mobile-cart-pay-rows">
          {metodos.map(metodo => {
            const active = selected === metodo.label
            return (
              <button
                key={metodo.id}
                type="button"
                onClick={() => onSelect(metodo.label)}
                className={`mobile-cart-pay-option${
                  active ? ' mobile-cart-pay-option--active' : ''
                }`}
              >
                <span className="min-w-0 text-left">
                  <span className="block text-[14px] font-medium">{metodo.label}</span>
                  {metodo.hint ? (
                    <span className="mt-0.5 block text-[11px] font-light text-[var(--text-muted)]">
                      {metodo.hint}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`mobile-cart-pay-radio flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                      : 'border-[var(--border-input)] bg-[var(--bg-card)]'
                  }`}
                >
                  {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              </button>
            )
          })}
        </div>
        {error ? (
          <p className="px-4 pb-3 text-[11px] text-red-400">{error}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {metodos.map(metodo => {
          const active = selected === metodo.label
          return (
            <button
              key={metodo.id}
              type="button"
              onClick={() => onSelect(metodo.label)}
              className={`flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-colors ${
                active
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-bold">{metodo.label}</span>
                {metodo.hint ? (
                  <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-muted)]">
                    {metodo.hint}
                  </span>
                ) : null}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {active ? <span className="block h-2 w-2 rounded-full bg-white" /> : null}
              </span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="mt-2 text-[12px] font-medium text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
