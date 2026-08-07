'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import type { VideoTipo } from '@/types'
import {
  getVideoEmbedUrl,
  isLikelyVideoUrl,
  isValidHttpUrl,
} from '@/lib/video-url'
import ProductVideoThumb from '@/components/catalog/ProductVideoThumb'
import ProductVideoPlayer from '@/components/catalog/ProductVideoPlayer'
import ProductVideoModal from '@/components/catalog/ProductVideoModal'

type Props = {
  url: string
  tipo: '' | VideoTipo
  /** Primera imagen del producto — igual que en el catálogo */
  posterUrl?: string | null
}

const PLATFORM_LABEL: Record<VideoTipo, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

/**
 * Preview idéntica al catálogo: thumb con play + reproductor embebido
 * (y modal al hacer click en el thumb).
 */
export default function AdminVideoPreview({ url, tipo, posterUrl }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const trimmed = url.trim()

  if (!trimmed && !tipo) return null

  if (!tipo) {
    return (
      <Shell tone="warn">
        <AlertCircle size={16} className="shrink-0 text-amber-500" />
        <p className="text-[12px] font-medium text-[var(--text-secondary)]">
          Elige la plataforma para previsualizar el video como en el catálogo.
        </p>
      </Shell>
    )
  }

  if (!trimmed) {
    return (
      <Shell tone="muted">
        <p className="text-[12px] font-medium text-[var(--text-muted)]">
          Pega el link de {PLATFORM_LABEL[tipo]} para ver cómo se verá en la
          tienda.
        </p>
      </Shell>
    )
  }

  if (!isValidHttpUrl(trimmed)) {
    return (
      <Shell tone="error">
        <AlertCircle size={16} className="shrink-0 text-red-400" />
        <p className="text-[12px] font-medium text-red-500">
          Ese texto no parece una URL válida (debe empezar con https://).
        </p>
      </Shell>
    )
  }

  if (!isLikelyVideoUrl(trimmed, tipo)) {
    return (
      <Shell tone="error">
        <AlertCircle size={16} className="shrink-0 text-red-400" />
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-red-500">
            El link no coincide con {PLATFORM_LABEL[tipo]}.
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Revisa la plataforma o pega el link oficial del video/reel.
          </p>
        </div>
      </Shell>
    )
  }

  const embed = getVideoEmbedUrl(trimmed, tipo)

  if (!embed) {
    return (
      <Shell tone="error">
        <AlertCircle size={16} className="shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-red-500">
            No pudimos generar el embed de este link.
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {tipo === 'tiktok'
              ? 'Usa el link completo del video (…/video/123…), no el acortado vm.tiktok.com.'
              : tipo === 'instagram'
                ? 'Usa un link de reel o publicación (/reel/… o /p/…).'
                : 'Revisa que el link de YouTube sea de un video o short.'}
          </p>
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--accent-deep)]"
          >
            Abrir link
            <ExternalLink size={12} />
          </a>
        </div>
      </Shell>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-emerald-500" />
        <p className="text-[12px] font-bold text-emerald-700">
          Así se verá en el catálogo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
        {/* Thumb = slide del carrusel */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">
            Slide en la galería
          </p>
          <div className="aspect-[3/4] overflow-hidden rounded-[20px] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <ProductVideoThumb
              posterUrl={posterUrl}
              tipo={tipo}
              playSize="md"
              onClick={() => setModalOpen(true)}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">
            Click en el play para abrir el modal (igual que en la tienda).
          </p>
        </div>

        {/* Player = contenido del modal */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">
            Video real (como en el modal)
          </p>
          <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-black shadow-[var(--shadow-soft)]">
            <ProductVideoPlayer url={trimmed} tipo={tipo} autoPlay />
          </div>
          <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">
            Este es el mismo reproductor del catálogo. Puedes reproducir,
            pausar y ver si el link se ve bien.
          </p>
        </div>
      </div>

      <ProductVideoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={trimmed}
        tipo={tipo}
        titulo="Vista previa del catálogo"
      />
    </div>
  )
}

function Shell({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: 'muted' | 'warn' | 'error'
}) {
  const toneClass =
    tone === 'error'
      ? 'border-red-200 bg-[color-mix(in_srgb,#ef4444_6%,white)]'
      : tone === 'warn'
        ? 'border-amber-200 bg-[color-mix(in_srgb,#f59e0b_8%,white)]'
        : 'border-[var(--border)] bg-[var(--bg-muted)]'

  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3.5 ${toneClass}`}
    >
      {children}
    </div>
  )
}
