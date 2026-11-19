'use client'

/**
 * Converts a product video in the browser to a web-friendly MP4 (H.264 + AAC),
 * max 1280px on the longest side, before uploading it. This fixes the two usual problems
 * with phone videos: huge files, and iPhone HEVC/.mov files that don't play on Android/Chrome.
 * Uses the browser's own encoder (WebCodecs) through mediabunny; loaded only when needed.
 */

export const MAX_VIDEO_INPUT_BYTES = 500 * 1024 * 1024 // what the admin may pick
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024 // what we store in R2
export const MAX_VIDEO_SECONDS = 180
const MAX_EDGE_PX = 1280

export type VideoProgress = { stage: 'analyzing' | 'converting'; percent: number }

export type OptimizedVideo = {
  file: File
  durationSeconds: number
  /** false when the browser couldn't convert and the original (already web-friendly) file is used */
  converted: boolean
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)

export async function optimizeVideoFile(
  file: File,
  onProgress?: (progress: VideoProgress) => void,
): Promise<OptimizedVideo> {
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) {
    throw new Error('El archivo no es un video')
  }
  if (file.size > MAX_VIDEO_INPUT_BYTES) {
    throw new Error('El video supera 500MB. Recórtalo un poco antes de subirlo.')
  }

  onProgress?.({ stage: 'analyzing', percent: 0 })
  const mb = await import('mediabunny')

  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) })
  const duration = await input.computeDuration()
  if (duration > MAX_VIDEO_SECONDS) {
    throw new Error(`El video dura más de ${MAX_VIDEO_SECONDS / 60} minutos. Usa un video más corto.`)
  }

  const videoTrack = await input.getPrimaryVideoTrack()
  if (!videoTrack) throw new Error('No se encontró imagen de video en el archivo')

  const sourceWidth = await videoTrack.getDisplayWidth()
  const sourceHeight = await videoTrack.getDisplayHeight()
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(sourceWidth, sourceHeight))
  const width = even(sourceWidth * scale)
  const height = even(sourceHeight * scale)

  const canEncode = await mb.canEncodeVideo('avc', { width, height }).catch(() => false)
  if (!canEncode) return fallbackToOriginal(file, duration)

  const output = new mb.Output({
    format: new mb.Mp4OutputFormat(), // BufferTarget → "fast start": playback begins before full download
    target: new mb.BufferTarget(),
  })

  const conversion = await mb.Conversion.init({
    input,
    output,
    video: {
      width,
      height,
      fit: 'fill', // exact source aspect ratio, so nothing is stretched or cropped
      codec: 'avc',
      quality: new mb.Quality('medium'),
      frameRate: 30,
    },
    audio: { codec: 'aac', quality: new mb.Quality({ bitrate: 96e3 }) },
  })

  if (!conversion.isValid) return fallbackToOriginal(file, duration)

  conversion.onProgress = progress => {
    onProgress?.({ stage: 'converting', percent: Math.round(progress * 100) })
  }

  try {
    await conversion.execute()
  } catch {
    return fallbackToOriginal(file, duration)
  }

  const buffer = output.target.buffer
  if (!buffer) return fallbackToOriginal(file, duration)

  const base = file.name.replace(/\.[^.]+$/, '') || 'video'
  const optimized = new File([buffer], `${base}.mp4`, { type: 'video/mp4' })
  // Rare: the original was already tiny and well encoded.
  const result = optimized.size < file.size || !isWebFriendly(file) ? optimized : file
  return assertUploadSize({ file: result, durationSeconds: duration, converted: result === optimized })
}

function isWebFriendly(file: File): boolean {
  return file.type === 'video/mp4' || file.type === 'video/webm'
}

function fallbackToOriginal(file: File, durationSeconds: number): OptimizedVideo {
  if (!isWebFriendly(file)) {
    throw new Error(
      'Este navegador no pudo convertir el video. Intenta desde Chrome o Safari actualizado, o súbelo en formato MP4.',
    )
  }
  return assertUploadSize({ file, durationSeconds, converted: false })
}

function assertUploadSize(result: OptimizedVideo): OptimizedVideo {
  if (result.file.size > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error('El video sigue siendo muy pesado (más de 80MB). Usa un video más corto.')
  }
  return result
}
