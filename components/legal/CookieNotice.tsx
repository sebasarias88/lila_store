'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'lila-cookie-notice-v1'

/**
 * Informative notice: the store only uses technical storage (cart, admin
 * session), so no consent is needed — just transparency. If analytics or ads
 * are ever added, this must become a real accept/reject consent banner.
 */
export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') setVisible(true)
    } catch {
      // Storage blocked: show nothing rather than nag on every page.
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-3 left-3 right-20 z-40 rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-soft)] sm:right-auto sm:max-w-sm"
    >
      <p className="flex gap-2 text-[13px] font-medium leading-snug text-[var(--text-secondary)]">
        <Cookie size={16} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" aria-hidden />
        <span>
          Solo usamos cookies técnicas para que tu carrito funcione. Nada de publicidad.{' '}
          <Link
            href="/politica-de-cookies"
            className="font-bold text-[var(--accent-deep)] underline underline-offset-2"
          >
            Ver más
          </Link>
        </span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-2.5 w-full rounded-full bg-[var(--accent-primary)] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-deep)]"
      >
        Entendido
      </button>
    </div>
  )
}
