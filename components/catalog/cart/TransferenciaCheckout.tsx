'use client'

import { useRef } from 'react'
import { Copy, Check, Landmark, Paperclip, X, FileText, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { DatosTransferencia } from '@/lib/transferencia'
import { validarArchivoComprobante } from '@/lib/transferencia'

type TransferenciaCheckoutProps = {
  datos: DatosTransferencia
  totalLabel: string
  comprobante: File | null
  onComprobanteChange: (file: File | null) => void
  compact?: boolean
}

export default function TransferenciaCheckout({
  datos,
  totalLabel,
  comprobante,
  onComprobanteChange,
  compact = false,
}: TransferenciaCheckoutProps) {
  const [copied, setCopied] = useState<'cuenta' | 'llave' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const copiar = async (valor: string, tipo: 'cuenta' | 'llave') => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopied(tipo)
      toast.success(tipo === 'llave' ? 'Llave copiada' : 'Número de cuenta copiado')
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      toast.error('No se pudo copiar. Cópialo a mano.')
    }
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const valid = validarArchivoComprobante(file)
    if (!valid.ok) {
      toast.error(valid.message)
      return
    }
    onComprobanteChange(file)
  }

  const rows = [
    { label: 'Banco', value: datos.banco },
    { label: 'Tipo de cuenta', value: datos.tipoCuenta },
    { label: 'Titular', value: datos.titular },
  ]

  return (
    <div
      className={`mt-3 space-y-3 ${
        compact ? '' : ''
      }`}
    >
      <div
        className={`rounded-[20px] border border-[var(--border)] bg-[var(--bg-muted)] ${
          compact ? 'p-3.5' : 'p-4'
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--accent-primary)]">
            <Landmark size={15} />
          </span>
          <p className="text-[13px] font-bold text-[var(--accent-deep)]">
            Datos para transferir
          </p>
        </div>

        <dl className="space-y-2.5">
          {rows.map(row => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[11px] font-medium text-[var(--text-muted)]">
                {row.label}
              </dt>
              <dd className="text-right text-[13px] font-bold text-[var(--text-primary)]">
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5">
            <dt className="text-[11px] font-medium text-[var(--text-muted)]">
              Número de cuenta
            </dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
                {datos.numeroCuenta}
              </span>
              <button
                type="button"
                onClick={() => void copiar(datos.numeroCuenta, 'cuenta')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)]"
                aria-label="Copiar número de cuenta"
              >
                {copied === 'cuenta' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </dd>
          </div>
          {datos.llave ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[11px] font-medium text-[var(--text-muted)]">
                Llave
              </dt>
              <dd className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                  {datos.llave}
                </span>
                <button
                  type="button"
                  onClick={() => void copiar(datos.llave, 'llave')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)]"
                  aria-label="Copiar llave"
                >
                  {copied === 'llave' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-3 text-[12px] font-medium leading-relaxed text-[var(--text-secondary)]">
          Transfiere el valor total del pedido{' '}
          <span className="font-bold text-[var(--accent-deep)]">{totalLabel}</span> a
          esta cuenta. Luego confirma por WhatsApp.
        </p>
      </div>

      <div
        className={`rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] ${
          compact ? 'p-3.5' : 'p-4'
        }`}
      >
        <p className="text-[13px] font-bold text-[var(--text-primary)]">
          Adjuntar comprobante de pago
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
          Opcional. Imagen o PDF. Nos ayuda a verificar más rápido.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={e => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        {comprobante ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5">
            {comprobante.type === 'application/pdf' ? (
              <FileText size={16} className="shrink-0 text-[var(--accent-deep)]" />
            ) : (
              <ImageIcon size={16} className="shrink-0 text-[var(--accent-deep)]" />
            )}
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--text-primary)]">
              {comprobante.name}
            </span>
            <button
              type="button"
              onClick={() => onComprobanteChange(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white hover:text-red-400"
              aria-label="Quitar comprobante"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <Paperclip size={14} />
            Elegir archivo
          </button>
        )}
      </div>
    </div>
  )
}
