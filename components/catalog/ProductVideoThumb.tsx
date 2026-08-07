'use client'

import { Play } from 'lucide-react'
import type { VideoTipo } from '@/types'

type Props = {
  posterUrl?: string | null
  tipo?: VideoTipo | null
  className?: string
  /** Tamaño del botón play */
  playSize?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  asButton?: boolean
}

const PLAY = {
  sm: 'h-9 w-9',
  md: 'h-14 w-14',
  lg: 'h-16 w-16',
} as const

const ICON = {
  sm: 14,
  md: 22,
  lg: 26,
} as const

/**
 * Slide / thumb de video como se ve en el catálogo:
 * primera imagen de fondo + play centrado.
 */
export default function ProductVideoThumb({
  posterUrl,
  tipo,
  className = '',
  playSize = 'md',
  onClick,
  asButton = true,
}: Props) {
  const label =
    tipo === 'youtube'
      ? 'Ver video de YouTube'
      : tipo === 'tiktok'
        ? 'Ver video de TikTok'
        : tipo === 'instagram'
          ? 'Ver video de Instagram'
          : 'Ver video'

  const content = (
    <>
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)]" />
      )}
      <div className="absolute inset-0 bg-[rgba(42,34,64,0.35)]" />
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] ${PLAY[playSize]}`}
        aria-hidden
      >
        <Play size={ICON[playSize]} className="ml-0.5" fill="currentColor" />
      </span>
      {tipo ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-deep)] shadow-sm">
          {tipo}
        </span>
      ) : null}
    </>
  )

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`relative block h-full w-full overflow-hidden ${className}`}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {content}
    </div>
  )
}
