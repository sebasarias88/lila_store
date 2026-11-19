/** Largest photo the admin can pick (phone photos can be big; we shrink them in the browser). */
export const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024

/** Longest side after resizing. */
export const MAX_IMAGE_EDGE_PX = 1600

/** Starting WebP quality (0–1). */
export const WEBP_QUALITY = 0.82

/** Never go below this quality to hit the size target (keeps photos looking good). */
const MIN_QUALITY = 0.55
/** Never shrink below this longest side to hit the size target. */
const MIN_EDGE_PX = 900

/**
 * Weight budget per image type, so every photo stays light no matter what the admin uploads.
 * Product/category photos: ≤150KB. Banners are full-width, so they get a bit more.
 */
export const IMAGE_SIZE_TARGET_BYTES = {
  productos: 150 * 1024,
  categorias: 150 * 1024,
  promociones: 250 * 1024,
  banners: 350 * 1024,
  variaciones: 150 * 1024,
} as const

function encode(bitmap: ImageBitmap, edge: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality))
}

/**
 * Compresses and resizes an image in the browser (canvas → WebP).
 * With `targetBytes`, it lowers quality step by step (down to 0.55) and, only if still
 * needed, the dimensions (down to 900px), until the file fits the budget.
 */
export async function optimizeImageFile(
  file: File,
  options?: {
    maxBytes?: number
    maxEdge?: number
    quality?: number
    targetBytes?: number
  },
): Promise<File> {
  const maxBytes = options?.maxBytes ?? MAX_IMAGE_UPLOAD_BYTES
  const maxEdge = options?.maxEdge ?? MAX_IMAGE_EDGE_PX
  const startQuality = options?.quality ?? WEBP_QUALITY
  const targetBytes = options?.targetBytes

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen')
  }

  if (file.size > maxBytes) {
    throw new Error(`La imagen supera ${Math.round(maxBytes / (1024 * 1024))}MB`)
  }

  // SVG / animated GIF: don't pass through canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  const bitmap = await createImageBitmap(file)
  try {
    let edge = maxEdge
    let quality = startQuality
    let best = await encode(bitmap, edge, quality)
    if (!best) return file

    // Try progressively lighter versions until it fits the budget (at most ~10 encodes).
    while (targetBytes && best.size > targetBytes) {
      if (quality - 0.07 >= MIN_QUALITY) {
        quality = +(quality - 0.07).toFixed(2)
      } else if (edge * 0.85 >= MIN_EDGE_PX) {
        edge = Math.round(edge * 0.85)
        quality = 0.72
      } else {
        break // best effort: keep the lightest acceptable version
      }
      const next = await encode(bitmap, edge, quality)
      if (!next) break
      if (next.size < best.size) best = next
    }

    const alreadySmall = Math.max(bitmap.width, bitmap.height) <= maxEdge
    // If WebP doesn't beat an already small, already compressed original, keep the original
    if (best.size >= file.size && alreadySmall && (!targetBytes || file.size <= targetBytes)) {
      return file
    }

    const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
    return new File([best], `${base}.webp`, { type: 'image/webp' })
  } finally {
    bitmap.close()
  }
}

export type OptimizeImageResult =
  | { ok: true; file: File; skipped: boolean }
  | { ok: false; message: string }

/**
 * Result-style wrapper (never throws) for places that just need a lighter
 * image, e.g. the customer's transfer receipt. Max 5MB input, WebP output.
 */
export async function optimizeImage(file: File): Promise<OptimizeImageResult> {
  try {
    const out = await optimizeImageFile(file, { maxBytes: 5 * 1024 * 1024 })
    return { ok: true, file: out, skipped: out === file }
  } catch (error) {
    if (error instanceof Error && /supera|no es una imagen/.test(error.message)) {
      return { ok: false, message: error.message }
    }
    // Unreadable format in this browser (e.g. HEIC on Chrome): keep the original.
    return { ok: true, file, skipped: true }
  }
}
