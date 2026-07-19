'use client'

import { RefreshCw, WifiOff } from 'lucide-react'

export default function AdminLoadError({
  onRetry,
  title = 'No se pudo cargar la información',
  description = 'Revisa tu conexión a internet e inténtalo de nuevo.',
}: {
  onRetry: () => void
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(248,113,113,0.3)] bg-[var(--bg-card)] px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] text-red-400">
        <WifiOff size={22} strokeWidth={1.5} />
      </span>
      <p className="text-[14px] font-light text-[var(--text-primary)]">{title}</p>
      <p className="mt-1.5 max-w-sm text-[12px] font-light text-[var(--text-muted)]">
        {description}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-[10px] font-light tracking-normal text-[var(--accent-primary)] transition-all hover:bg-[var(--bg-muted)]"
      >
        <RefreshCw size={13} />
        Reintentar
      </button>
    </div>
  )
}
