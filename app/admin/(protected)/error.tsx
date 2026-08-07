'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, TriangleAlert } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.08)] text-[var(--accent-primary)]">
        <TriangleAlert size={26} strokeWidth={1.5} />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal text-[var(--text-primary)]">
          Algo salió mal
        </h1>
        <p className="mx-auto max-w-md text-[13px] font-light leading-relaxed text-[var(--text-subtle)]">
          No pudimos cargar esta sección del panel. Revisa tu conexión a
          internet e inténtalo de nuevo.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-secondary)] px-6 py-3 text-[12px] font-bold text-[var(--bg-base)] transition-all hover:opacity-90"
        >
          <RefreshCw size={13} />
          Reintentar
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded-xl border border-[var(--border)] px-6 py-3 text-[12px] font-bold text-[var(--accent-primary)] transition-all hover:bg-[var(--bg-muted)]"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  )
}
