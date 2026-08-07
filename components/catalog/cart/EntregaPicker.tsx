'use client'

import { Store, Truck } from 'lucide-react'
import { SUCURSALES, formatSucursalLabel } from '@/lib/negocio'
import type { TipoEntrega } from '@/types'

type EntregaPickerProps = {
  tipoEntrega: TipoEntrega
  sucursalRecogida: string
  error?: string
  onTipoChange: (tipo: TipoEntrega) => void
  onSucursalChange: (label: string) => void
  /** Estilo más compacto para mobile */
  compact?: boolean
}

export default function EntregaPicker({
  tipoEntrega,
  sucursalRecogida,
  error,
  onTipoChange,
  onSucursalChange,
  compact = false,
}: EntregaPickerProps) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <p
          className={`font-bold text-[var(--accent-deep)] ${
            compact ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          ¿Cómo lo recibes? ✨
        </p>
        <p
          className={`mt-1 font-medium text-[var(--text-muted)] ${
            compact ? 'text-[11px]' : 'text-[12px]'
          }`}
        >
          Envío a domicilio o recoges en una de nuestras tiendas
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <button
          type="button"
          onClick={() => onTipoChange('envio')}
          className={`flex items-center gap-3 rounded-[20px] border px-4 text-left transition-colors ${
            compact ? 'py-3' : 'py-3.5'
          } ${
            tipoEntrega === 'envio'
              ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] shadow-[var(--shadow-soft)]'
              : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))]'
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              tipoEntrega === 'envio'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
            }`}
          >
            <Truck size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-[var(--text-primary)]">
              Envío a domicilio
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-muted)]">
              Te lo llevamos a tu ciudad
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTipoChange('recogida')}
          className={`flex items-center gap-3 rounded-[20px] border px-4 text-left transition-colors ${
            compact ? 'py-3' : 'py-3.5'
          } ${
            tipoEntrega === 'recogida'
              ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] shadow-[var(--shadow-soft)]'
              : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))]'
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              tipoEntrega === 'recogida'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
            }`}
          >
            <Store size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-[var(--text-primary)]">
              Recoger en tienda
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-muted)]">
              Sin envío · eliges la sucursal
            </span>
          </span>
        </button>
      </div>

      {tipoEntrega === 'recogida' && (
        <div className="space-y-2">
          <p
            className={`font-bold text-[var(--text-muted)] ${
              compact ? 'text-[11px]' : 'text-[12px]'
            }`}
          >
            Elige la tienda *
          </p>
          <div className="space-y-2">
            {SUCURSALES.map(s => {
              const label = formatSucursalLabel(s)
              const active = sucursalRecogida === label
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSucursalChange(label)}
                  className={`flex w-full items-start gap-3 rounded-[18px] border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? 'border-[var(--accent-primary)] bg-white shadow-[var(--shadow-soft)]'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]/60'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                        : 'border-[var(--border)] bg-white'
                    }`}
                    aria-hidden
                  >
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[var(--text-primary)]">
                      {s.ciudad}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-medium text-[var(--text-muted)]">
                      {s.direccion}
                    </span>
                    {s.nota ? (
                      <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-subtle)]">
                        {s.nota}
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
          {error ? (
            <p className="text-[12px] font-medium text-red-400">{error}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
