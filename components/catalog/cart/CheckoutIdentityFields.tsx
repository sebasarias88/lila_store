'use client'

import type { Dispatch, SetStateAction } from 'react'
import { FileCheck2 } from 'lucide-react'
import type { DatosCliente } from '@/types'
import { DOCUMENT_TYPES, INVOICE_DOCUMENT_TYPES } from '@/lib/orders/shared'

type Props = {
  datos: DatosCliente
  setDatos: Dispatch<SetStateAction<DatosCliente>>
  errores: Partial<DatosCliente>
  setErrores: Dispatch<SetStateAction<Partial<DatosCliente>>>
  /** Desktop uses the page's input styles; mobile uses the compact checkout styles. */
  variant: 'desktop' | 'mobile'
  inputClass?: (campo: keyof DatosCliente) => string
}

const MOBILE_INPUT = 'mobile-cart-checkout-field__input'

function Field({
  id,
  label,
  required,
  error,
  hint,
  variant,
  children,
}: {
  id?: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  variant: Props['variant']
  children: React.ReactNode
}) {
  if (variant === 'mobile') {
    return (
      <div className={`mobile-cart-checkout-field${error ? ' mobile-cart-checkout-field--error' : ''}`}>
        <label htmlFor={id} className="mobile-cart-checkout-field__label">
          {label}
          {required ? <span className="text-[var(--accent-primary)]"> *</span> : null}
        </label>
        {children}
        {error ? <p className="mobile-cart-checkout-field__error">{error}</p> : hint ? (
          <p className="mt-1 text-[11px] font-medium text-[var(--text-subtle)]">{hint}</p>
        ) : null}
      </div>
    )
  }
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12px] font-bold text-[var(--text-muted)]">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] font-medium text-[var(--text-subtle)]">{hint}</p>
      ) : null}
    </div>
  )
}

/** Segmented chips instead of a native select. */
function TypeChips({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; short: string; label: string }[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.label}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
              active
                ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[var(--accent-primary)]'
            }`}
          >
            {o.short}
          </button>
        )
      })}
    </div>
  )
}

function Check({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--bg-muted)] px-3.5 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-[var(--text-primary)]">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-[var(--text-subtle)]">{description}</span>
        ) : null}
      </span>
    </label>
  )
}

/** Identity document of the customer (required). */
export function DocumentFields({ datos, setDatos, errores, setErrores, variant, inputClass }: Props) {
  const cls = variant === 'mobile' ? MOBILE_INPUT : inputClass?.('numeroDocumento') ?? ''
  return (
    <Field
      id="cart-documento"
      label="Documento de identidad"
      required
      error={errores.numeroDocumento}
      hint="Lo necesitamos para la guía de envío y tu factura."
      variant={variant}
    >
      <div className="space-y-2">
        <TypeChips
          label="Tipo de documento"
          options={DOCUMENT_TYPES}
          value={datos.tipoDocumento}
          onChange={id => setDatos(d => ({ ...d, tipoDocumento: id }))}
        />
        <input
          id="cart-documento"
          type="text"
          inputMode={datos.tipoDocumento === 'CC' ? 'numeric' : 'text'}
          autoComplete="off"
          maxLength={20}
          value={datos.numeroDocumento}
          onChange={e => {
            setDatos(d => ({ ...d, numeroDocumento: e.target.value }))
            if (errores.numeroDocumento) setErrores(er => ({ ...er, numeroDocumento: '' }))
          }}
          placeholder={datos.tipoDocumento === 'CC' ? 'Ej: 1094123456' : 'Número de documento'}
          className={cls}
        />
      </div>
    </Field>
  )
}

/** Optional electronic invoice (customer's choice). */
export function InvoiceFields({ datos, setDatos, errores, setErrores, variant, inputClass }: Props) {
  const wants = datos.quiereFactura === 'si'
  const other = datos.facturaOtroTitular === 'si'
  const cls = (campo: keyof DatosCliente) => (variant === 'mobile' ? MOBILE_INPUT : inputClass?.(campo) ?? '')
  const clear = (campo: keyof DatosCliente) => {
    if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
  }

  return (
    <div className="space-y-3">
      <Check
        checked={wants}
        onChange={v => setDatos(d => ({ ...d, quiereFactura: v ? 'si' : '' }))}
        title="Quiero factura electrónica"
        description="Te la enviamos a tu correo. Si no la necesitas, deja esta casilla sin marcar."
      />
      {wants ? (
        <div className={`space-y-4 ${variant === 'mobile' ? '' : 'rounded-[18px] border border-[var(--border)] p-4'}`}>
          <Field id="cart-factura-correo" label="Correo para la factura" required error={errores.facturaCorreo} variant={variant}>
            <input
              id="cart-factura-correo"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={160}
              value={datos.facturaCorreo}
              onChange={e => {
                setDatos(d => ({ ...d, facturaCorreo: e.target.value }))
                clear('facturaCorreo')
              }}
              placeholder="tucorreo@ejemplo.com"
              className={cls('facturaCorreo')}
            />
          </Field>

          <Check
            checked={other}
            onChange={v => setDatos(d => ({ ...d, facturaOtroTitular: v ? 'si' : '' }))}
            title="La factura va a nombre de otra persona o empresa"
          />

          {other ? (
            <>
              <Field
                id="cart-factura-nombre"
                label="Nombre o razón social"
                required
                error={errores.facturaNombre}
                variant={variant}
              >
                <input
                  id="cart-factura-nombre"
                  type="text"
                  maxLength={160}
                  value={datos.facturaNombre}
                  onChange={e => {
                    setDatos(d => ({ ...d, facturaNombre: e.target.value }))
                    clear('facturaNombre')
                  }}
                  placeholder="Ej: Distribuciones Lila S.A.S."
                  className={cls('facturaNombre')}
                />
              </Field>
              <Field
                id="cart-factura-documento"
                label="Documento o NIT de la factura"
                required
                error={errores.facturaNumeroDocumento}
                variant={variant}
              >
                <div className="space-y-2">
                  <TypeChips
                    label="Tipo de documento de la factura"
                    options={INVOICE_DOCUMENT_TYPES}
                    value={datos.facturaTipoDocumento}
                    onChange={id => setDatos(d => ({ ...d, facturaTipoDocumento: id }))}
                  />
                  <input
                    id="cart-factura-documento"
                    type="text"
                    maxLength={20}
                    value={datos.facturaNumeroDocumento}
                    onChange={e => {
                      setDatos(d => ({ ...d, facturaNumeroDocumento: e.target.value }))
                      clear('facturaNumeroDocumento')
                    }}
                    placeholder={datos.facturaTipoDocumento === 'NIT' ? 'Ej: 900123456-7' : 'Número de documento'}
                    className={cls('facturaNumeroDocumento')}
                  />
                </div>
              </Field>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Small badge used in the review step. */
export function InvoiceSummaryIcon() {
  return <FileCheck2 size={13} strokeWidth={1.75} />
}
