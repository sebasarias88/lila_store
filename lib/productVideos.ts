import type { Producto, ProductoVideo, VideoTipo } from '@/types'

export const MAX_PRODUCT_VIDEOS = 5

const VIDEO_TIPOS: VideoTipo[] = ['archivo', 'youtube', 'tiktok', 'instagram']

/**
 * A product's videos as a clean list: uses `videos` and falls back to the legacy
 * single `video_url`/`video_tipo` (products saved before multiple videos existed).
 */
export function getProductVideos(
  producto: Pick<Producto, 'videos' | 'video_url' | 'video_tipo'> | null | undefined,
): ProductoVideo[] {
  if (!producto) return []
  const list = Array.isArray(producto.videos) ? producto.videos : []
  const clean = list.filter(
    (v): v is ProductoVideo =>
      Boolean(v) && typeof v.url === 'string' && v.url.trim() !== '' && VIDEO_TIPOS.includes(v.tipo),
  )
  if (clean.length) return clean.slice(0, MAX_PRODUCT_VIDEOS)
  if (producto.video_url && producto.video_tipo) {
    return [{ url: producto.video_url, tipo: producto.video_tipo }]
  }
  return []
}
