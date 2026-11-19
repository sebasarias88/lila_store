'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, Film, Link2, Loader2, Plus, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductoVideo, VideoTipo } from '@/types'
import ProductVideoPlayer from '@/components/catalog/ProductVideoPlayer'
import { uploadCatalogVideo, type VideoUploadProgress } from '@/lib/catalogVideos'
import { MAX_PRODUCT_VIDEOS } from '@/lib/productVideos'
import { detectVideoTipo } from '@/lib/video-url'

const STAGE_LABEL: Record<VideoUploadProgress['stage'], string> = {
  analyzing: 'Analizando video…',
  converting: 'Optimizando video',
  uploading: 'Subiendo video',
}

const TIPO_LABEL: Record<VideoTipo, string> = {
  archivo: 'Video subido',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

/**
 * Up to 5 videos per product: upload files (converted in the browser to a
 * light MP4 and stored on R2, never in the database) and/or paste TikTok,
 * YouTube or Instagram links. The order is the order shown in the store.
 */
export default function ProductVideosField({
  videos,
  onChange,
  onUploadingChange,
  poster,
}: {
  videos: ProductoVideo[]
  onChange: (videos: ProductoVideo[]) => void
  onUploadingChange?: (uploading: boolean) => void
  poster?: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<VideoUploadProgress | null>(null)
  const [linkDraft, setLinkDraft] = useState('')
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const uploading = progress !== null
  const full = videos.length >= MAX_PRODUCT_VIDEOS

  // An upload can take a while: always add to the latest list.
  const videosRef = useRef(videos)
  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  const addVideo = (video: ProductoVideo) => {
    const current = videosRef.current
    if (current.length >= MAX_PRODUCT_VIDEOS) {
      toast.error(`Máximo ${MAX_PRODUCT_VIDEOS} videos por producto`)
      return
    }
    if (current.some(v => v.url === video.url)) {
      toast.error('Ese video ya está agregado')
      return
    }
    onChange([...current, video])
    setPreviewIndex(current.length)
  }

  const handleFile = async (file: File) => {
    setProgress({ stage: 'analyzing', percent: 0 })
    onUploadingChange?.(true)
    try {
      const result = await uploadCatalogVideo(file, setProgress)
      addVideo({ url: result.url, tipo: 'archivo' })
      const sizeMb = (result.sizeBytes / (1024 * 1024)).toFixed(1)
      toast.success(`Video listo (${sizeMb} MB). Guarda el producto para aplicarlo.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el video')
    } finally {
      setProgress(null)
      onUploadingChange?.(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleAddLink = () => {
    const url = linkDraft.trim()
    if (!url) return
    const tipo = detectVideoTipo(url)
    if (!tipo) {
      toast.error('Pega un enlace de YouTube, TikTok o Instagram')
      return
    }
    addVideo({ url, tipo })
    setLinkDraft('')
  }

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= videos.length) return
    const next = [...videos]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setPreviewIndex(null)
  }

  const remove = (index: number) => {
    onChange(videos.filter((_, i) => i !== index))
    setPreviewIndex(null)
  }

  const iconButton =
    'flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="admin-form-label">Videos del producto (opcional)</span>
        <span className="text-[11px] text-[var(--text-subtle)]">
          {videos.length}/{MAX_PRODUCT_VIDEOS}
        </span>
      </div>

      {videos.length > 0 && (
        <ul className="space-y-2">
          {videos.map((video, index) => (
            <li
              key={`${video.url}-${index}`}
              className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)]"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-deep)]">
                  {video.tipo === 'archivo' ? <Film size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-[var(--text-primary)]">
                    Video {index + 1} · {TIPO_LABEL[video.tipo]}
                  </p>
                  <p className="truncate text-[11px] text-[var(--text-subtle)]">{video.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
                  className={iconButton}
                  aria-label={previewIndex === index ? 'Ocultar vista previa' : 'Ver vista previa'}
                >
                  {previewIndex === index ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || uploading}
                  className={iconButton}
                  aria-label="Subir en el orden"
                >
                  <ChevronUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === videos.length - 1 || uploading}
                  className={iconButton}
                  aria-label="Bajar en el orden"
                >
                  <ChevronDown size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={uploading}
                  className={`${iconButton} hover:!text-[var(--danger)]`}
                  aria-label={`Quitar video ${index + 1}`}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
              {previewIndex === index && (
                <div className="border-t border-[var(--border)] bg-black">
                  <ProductVideoPlayer
                    url={video.url}
                    tipo={video.tipo}
                    poster={poster}
                    className="mx-auto max-w-sm"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <>
          <button
            type="button"
            disabled={uploading}
            aria-busy={uploading || undefined}
            onClick={() => inputRef.current?.click()}
            className="admin-upload-zone min-h-[7rem] w-full disabled:cursor-wait"
          >
            {uploading ? (
              <div className="w-full max-w-xs space-y-2 text-center" role="status">
                <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
                  <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" aria-hidden />
                  <span className="text-[12px] font-semibold">
                    {STAGE_LABEL[progress.stage]}
                    {progress.stage !== 'analyzing' ? ` ${progress.percent}%` : ''}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-300"
                    style={{ width: `${progress.stage === 'analyzing' ? 5 : progress.percent}%` }}
                  />
                </div>
                <p className="admin-upload-zone__meta">No cierres esta ventana hasta que termine</p>
              </div>
            ) : (
              <>
                <Upload size={20} className="mb-2 text-[var(--accent-primary)]" aria-hidden />
                <p className="admin-upload-zone__title">
                  <span className="text-[var(--accent-deep)]">
                    {videos.length ? 'Subir otro video' : 'Subir un video'}
                  </span>{' '}
                  desde tu celular o computador
                </p>
                <p className="admin-upload-zone__meta">
                  MP4, MOV (iPhone) o WEBM · máx. 3 minutos · se optimiza solo
                </p>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[11px] font-semibold text-[var(--text-faint)]">o pega un enlace</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              disabled={uploading}
              value={linkDraft}
              onChange={e => setLinkDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLink()
                }
              }}
              placeholder="https://www.tiktok.com/@usuario/video/..."
              aria-label="Enlace de YouTube, TikTok o Instagram"
              className="admin-input min-w-0 flex-1 rounded-xl border px-4 py-3 text-[13px]"
            />
            <button
              type="button"
              onClick={handleAddLink}
              disabled={uploading || !linkDraft.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)] disabled:opacity-40"
            >
              <Plus size={13} aria-hidden />
              Agregar
            </button>
          </div>
        </>
      )}

      <p className="admin-form-hint">
        Hasta {MAX_PRODUCT_VIDEOS} videos: súbelos directo o pega enlaces de TikTok, YouTube o
        Instagram. Se muestran en este orden, después de las fotos.
      </p>
    </div>
  )
}
