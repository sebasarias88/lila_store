'use client'

import type { VideoTipo } from '@/types'
import {
  getVideoEmbedUrl,
  videoEmbedAspect,
} from '@/lib/video-url'

type Props = {
  url: string
  tipo: VideoTipo
  className?: string
  /** autoplay muted — útil en preview admin */
  autoPlay?: boolean
  /** Product photo shown before an uploaded video starts. */
  poster?: string | null
}

/**
 * Reproductor embebido (mismo que usa el modal del catálogo).
 */
export default function ProductVideoPlayer({
  url,
  tipo,
  className = '',
  autoPlay = false,
  poster,
}: Props) {
  if (tipo === 'archivo') {
    // Uploaded MP4 on R2: native player, only metadata is downloaded until play.
    return (
      <div className={`relative flex w-full items-center justify-center bg-black ${className}`}>
        <video
          key={url}
          src={url}
          poster={poster ?? undefined}
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          muted={autoPlay}
          className="max-h-[70vh] w-full object-contain"
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    )
  }

  const embed = getVideoEmbedUrl(url, tipo)
  const portrait = videoEmbedAspect(tipo) === 'portrait'

  if (!embed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--bg-muted)] px-4 py-10 text-center ${className}`}
      >
        <p className="text-[12px] font-medium text-[var(--text-muted)]">
          No se pudo cargar el embed de este video.
        </p>
      </div>
    )
  }

  const src =
    tipo === 'youtube' && autoPlay
      ? `${embed}?rel=0&autoplay=1&mute=1`
      : tipo === 'youtube'
        ? `${embed}?rel=0`
        : embed

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${
        portrait ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-video'
      } ${className}`}
    >
      <iframe
        key={src}
        src={src}
        title={`Video ${tipo}`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
