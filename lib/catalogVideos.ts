'use client'

import { optimizeVideoFile, type VideoProgress } from '@/lib/videoOptimize'

export type VideoUploadProgress =
  | VideoProgress
  | { stage: 'uploading'; percent: number }

type PresignResponse = {
  uploadUrl?: string
  publicUrl?: string
  headers?: Record<string, string>
  error?: string
}

/** PUT with upload progress (fetch has no upload progress events). */
function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value))
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`No se pudo subir el video (error ${xhr.status})`))
    xhr.onerror = () => reject(new Error('Se perdió la conexión mientras se subía el video'))
    xhr.send(file)
  })
}

/**
 * Optimizes the video in the browser, then uploads it directly to R2 with a
 * signed URL from the admin-only API. Returns the public URL.
 */
export async function uploadCatalogVideo(
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void,
): Promise<{ url: string; sizeBytes: number; converted: boolean }> {
  const optimized = await optimizeVideoFile(file, onProgress)

  const presign = await fetch('/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: optimized.file.type, size: optimized.file.size }),
  })
  const data = (await presign.json().catch(() => ({}))) as PresignResponse
  if (!presign.ok || !data.uploadUrl || !data.publicUrl) {
    throw new Error(data.error || 'No se pudo preparar la subida del video')
  }

  onProgress?.({ stage: 'uploading', percent: 0 })
  await putWithProgress(data.uploadUrl, optimized.file, data.headers || {}, percent =>
    onProgress?.({ stage: 'uploading', percent }),
  )

  return { url: data.publicUrl, sizeBytes: optimized.file.size, converted: optimized.converted }
}
