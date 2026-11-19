'use client'

import { IMAGE_SIZE_TARGET_BYTES, optimizeImageFile } from '@/lib/optimizeImage'
import { THUMB_MAX_EDGE_PX, THUMB_WEBP_QUALITY } from '@/lib/imageVariants'

export type CatalogImageFolder = 'productos' | 'categorias' | 'banners' | 'promociones' | 'variaciones'

/**
 * Optimizes the image in the browser (WebP, max 1600px) and uploads it to R2
 * through the admin-only API route. Returns the public URL.
 */
export async function uploadCatalogImage(file: File, folder: CatalogImageFolder): Promise<string> {
  // WebP + weight budget per type (e.g. product photos ≤150KB): no manual work for the admin.
  const optimized = await optimizeImageFile(file, { targetBytes: IMAGE_SIZE_TARGET_BYTES[folder] })
  const thumbnail = await optimizeImageFile(file, {
    maxEdge: THUMB_MAX_EDGE_PX,
    quality: THUMB_WEBP_QUALITY,
    targetBytes: 60 * 1024,
  }).catch(() => null)

  const body = new FormData()
  body.append('file', optimized)
  if (thumbnail && thumbnail.type === 'image/webp') body.append('thumb', thumbnail)
  body.append('folder', folder)

  const response = await fetch('/api/admin/images', { method: 'POST', body })
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }

  if (!response.ok || !data.url) {
    throw new Error(data.error || 'No se pudo subir la imagen')
  }
  return data.url
}

/** Deletes images stored in R2. URLs from other origins (e.g. legacy Supabase) are ignored by the server. */
export async function deleteCatalogImages(urls: string[]): Promise<void> {
  const list = urls.filter(Boolean)
  if (!list.length) return

  const response = await fetch('/api/admin/images', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: list }),
  })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || 'No se pudieron eliminar las imágenes')
  }
}
