'use client'

import type { MetodoPagoOpcion } from '@/lib/payment-methods'
import { PAGOS_COPY, PAGOS_EN_DESARROLLO } from '@/lib/pagos-proximos'

type MetodoPagoPickerProps = {
  metodos: MetodoPagoOpcion[]
  selected: string
  error?: string
  onSelect: (label: string) => void
  /** Estilo más compacto para mobile */
  compact?: boolean
  /** Muestra pasarelas próximas como filas deshabilitadas */
  showProximos?: boolean
}

export default function MetodoPagoPicker({
  metodos,
  selected,
  error,
  onSelect,
  compact = false,
  showProximos = true,
}: MetodoPagoPickerProps) {
  if (metodos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-center text-[13px] font-medium text-[var(--text-muted)]">
        No hay métodos de pago activos. Configúralos en el admin.
      </p>
    )
  }

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

          {showProximos
            ? PAGOS_EN_DESARROLLO.map(pago => (
                <div
                  key={pago.id}
                  aria-disabled="true"
                  className="mobile-cart-pay-option mobile-cart-pay-option--soon"
                >
                  <span className="min-w-0 text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium text-[var(--text-subtle)]">
                        {pago.label}
                      </span>
                      <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[var(--accent-deep)]">
                        Pronto
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] font-light text-[var(--text-faint)]">
                      {pago.detalle}
                    </span>
                  </span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] opacity-50" />
                </div>
              ))
            : null}
        </div>

        {showProximos ? (
          <p className="px-4 pb-2 pt-1 text-[11px] font-medium leading-relaxed text-[var(--text-muted)]">
            {PAGOS_COPY.checkoutNota}
          </p>
        ) : null}

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

        {showProximos
          ? PAGOS_EN_DESARROLLO.map(pago => (
              <div
                key={pago.id}
                aria-disabled="true"
                className="flex w-full cursor-not-allowed items-center justify-between gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-base)]/70 px-4 py-3.5 text-left opacity-80"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-[var(--text-subtle)]">
                      {pago.label}
                    </span>
                    <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[var(--accent-deep)]">
                      Pronto
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-faint)]">
                    {pago.detalle}
                  </span>
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-muted)] opacity-50" />
              </div>
            ))
          : null}
      </div>

      {showProximos ? (
        <p className="mt-3 text-[12px] font-medium leading-relaxed text-[var(--text-muted)]">
          {PAGOS_COPY.checkoutNota}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-[12px] font-medium text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
