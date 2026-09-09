'use client'

import Link from 'next/link'
import { CheckCircle2, MessageCircle, RotateCcw, Sparkles } from 'lucide-react'

type CartCheckoutSuccessProps = {
  productosHref: string
  onReabrirWhatsApp: () => void
  onVolverResumen: () => void
  onConfirmarEnviado: () => void
  compact?: boolean
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function CartCheckoutSuccess({
  productosHref,
  onReabrirWhatsApp,
  onVolverResumen,
  onConfirmarEnviado,
  compact = false,
}: CartCheckoutSuccessProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact
          ? 'rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-10 shadow-[var(--shadow-soft)]'
          : 'rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[#F9F6FF] to-[#F8EAF4] px-6 py-14 shadow-[var(--shadow-soft)] sm:px-10'
      }`}
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]">
        <CheckCircle2 size={compact ? 28 : 32} strokeWidth={2} />
      </span>
      <div className="mb-2 inline-flex items-center gap-1.5 text-[var(--accent-deep)]">
        <Sparkles size={14} />
        <span className="text-[12px] font-bold">Pedido listo</span>
      </div>
      <h2 className="text-[1.35rem] font-bold text-[var(--text-primary)] sm:text-[1.5rem]">
        Abre WhatsApp y envía tu mensaje
      </h2>
      <p className="mt-2 max-w-md text-[13px] font-medium leading-relaxed text-[var(--text-secondary)] sm:text-[14px]">
        Tu carrito se mantiene hasta que confirmes que ya enviaste el mensaje. Si WhatsApp no
        abrió, puedes reintentarlo.
      </p>

      <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5">
        <button
          type="button"
          onClick={onReabrirWhatsApp}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-95"
        >
          <WhatsAppIcon size={18} />
          Reabrir WhatsApp
        </button>
        <button
          type="button"
          onClick={onConfirmarEnviado}
          className="catalog-gold-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[13px] font-bold"
        >
          <MessageCircle size={16} />
          Ya envié el mensaje
        </button>
        <button
          type="button"
          onClick={onVolverResumen}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]"
        >
          <RotateCcw size={14} />
          Volver al resumen
        </button>
        <Link
          href={productosHref}
          className="mt-1 text-[12px] font-bold text-[var(--accent-deep)] underline-offset-2 hover:underline"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
