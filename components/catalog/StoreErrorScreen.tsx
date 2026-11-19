'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { WHATSAPP_NUMERO } from '@/lib/negocio'

/** Error screen for the store: retry, go home, or order by WhatsApp (never a dead end). */
export default function StoreErrorScreen({
  error,
  reset,
  homeHref,
  message,
}: {
  error: Error & { digest?: string }
  reset: () => void
  homeHref: string
  message: string
}) {
  useEffect(() => {
    console.error('[store] error boundary:', error)
  }, [error])

  const whatsappUrl = buildWhatsAppUrl(
    WHATSAPP_NUMERO,
    'Hola, la página no me cargó y quiero hacer un pedido 💕',
  )

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 pb-12 pt-28 text-center sm:pt-36 max-md:pt-[7rem]">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--bg-muted)] text-[var(--accent-deep)]">
        <TriangleAlert size={26} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-[24px] font-extrabold text-[var(--text-primary)]">Algo salió mal</h1>
        <p className="mx-auto max-w-md text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
          {message}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-6 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
        >
          <RefreshCw size={14} aria-hidden />
          Reintentar
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)] px-6 py-3 text-[13px] font-bold text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <MessageCircle size={14} aria-hidden />
          Pedir por WhatsApp
        </a>
        <Link
          href={homeHref}
          className="rounded-full px-4 py-3 text-[13px] font-bold text-[var(--text-secondary)] underline-offset-2 hover:underline"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
