'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, TriangleAlert } from 'lucide-react'

export default function MayoreoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Mayorista error:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] text-[var(--gold)]">
        <TriangleAlert size={26} strokeWidth={1.5} />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-thin uppercase tracking-[2px] text-[var(--text-primary)]">
          Algo salió mal
        </h1>
        <p className="mx-auto max-w-md text-[13px] font-light leading-relaxed text-[var(--text-subtle)]">
          No pudimos cargar el catálogo mayorista. Revisa tu conexión a
          internet e inténtalo de nuevo.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-[2px] bg-[var(--gold-bright)] px-6 py-3 text-[10px] font-light uppercase tracking-[2.5px] text-[var(--bg-base)] transition-all hover:opacity-90"
        >
          <RefreshCw size={13} />
          Reintentar
        </button>
        <Link
          href="/mayorista"
          className="rounded-[2px] border border-[var(--border)] px-6 py-3 text-[10px] font-light uppercase tracking-[2.5px] text-[var(--gold)] transition-all hover:bg-[var(--gold-muted)]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
