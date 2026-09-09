/**
 * Comprime imágenes en el navegador antes de subir a Storage.
 * Resize ~1600px max, WebP ~0.82, rechaza >5MB de entrada.
 */

const MAX_INPUT_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82

export type OptimizeImageResult =
  | { ok: true; file: File; skipped: boolean }
  | { ok: false; message: string }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality)
  })
}

/**
 * Optimiza un File de imagen a WebP (o lo deja igual si no aplica).
 */
export async function optimizeImage(file: File): Promise<OptimizeImageResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Solo se permiten imágenes' }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, message: 'La imagen no puede superar 5MB' }
  }

  // SVG / GIF animado: no re-encode
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { ok: true, file, skipped: true }
  }

  try {
    const img = await loadImage(file)
    const { naturalWidth: w, naturalHeight: h } = img
    if (!w || !h) {
      return { ok: false, message: 'Imagen inválida' }
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h))
    const tw = Math.max(1, Math.round(w * scale))
    const th = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { ok: true, file, skipped: true }
    }
    ctx.drawImage(img, 0, 0, tw, th)

    const blob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)
    if (!blob) {
      return { ok: true, file, skipped: true }
    }

    // Si WebP no ahorra, conservar original
    if (blob.size >= file.size && scale >= 1) {
      return { ok: true, file, skipped: true }
    }

    const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
    const optimized = new File([blob], `${base}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
    return { ok: true, file: optimized, skipped: false }
  } catch {
    return { ok: true, file, skipped: true }
  }
}
