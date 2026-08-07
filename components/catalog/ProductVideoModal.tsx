'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import type { VideoTipo } from '@/types'
import {
  getVideoEmbedUrl,
  videoEmbedAspect,
} from '@/lib/video-url'
import { useScrollLock } from '@/lib/useScrollLock'
import ProductVideoPlayer from '@/components/catalog/ProductVideoPlayer'

type Props = {
  open: boolean
  onClose: () => void
  url: string
  tipo: VideoTipo
  titulo?: string
}

export default function ProductVideoModal({
  open,
  onClose,
  url,
  tipo,
  titulo,
}: Props) {
  useScrollLock(open)
  const embed = getVideoEmbedUrl(url, tipo)
  const portrait = videoEmbedAspect(tipo) === 'portrait'

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar video"
            className="fixed inset-0 z-[80] bg-[rgba(58,46,61,0.55)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo || 'Video del producto'}
            className={`fixed left-1/2 top-1/2 z-[90] w-[min(100%-1.25rem,${portrait ? '380px' : '720px'})] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_24px_60px_rgba(110,79,168,0.28)]`}
            style={{
              width: portrait
                ? 'min(100% - 1.25rem, 380px)'
                : 'min(100% - 1.25rem, 720px)',
            }}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <p className="truncate text-[13px] font-bold text-[var(--accent-deep)]">
                {titulo || 'Video del producto'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-black p-0">
              {embed ? (
                <ProductVideoPlayer url={url} tipo={tipo} />
              ) : (
                <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                  <p className="text-[13px] font-medium text-white/90">
                    No pudimos embeber este link aquí.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-bold text-[var(--accent-deep)]"
                  >
                    Abrir en {tipo}
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
