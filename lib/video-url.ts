import type { VideoTipo } from '@/types'

/** Extrae el ID de un link de YouTube (watch, youtu.be, shorts, embed). */
export function getYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/')[2] || null
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2] || null
      }
      const v = u.searchParams.get('v')
      return v || null
    }

    return null
  } catch {
    return null
  }
}

export function getTiktokVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const parts = u.pathname.split('/').filter(Boolean)
    const videoIdx = parts.indexOf('video')
    if (videoIdx >= 0 && parts[videoIdx + 1]) {
      return parts[videoIdx + 1].replace(/\D/g, '') || parts[videoIdx + 1]
    }
    // vm.tiktok.com short links — no ID extractable without redirect
    return null
  } catch {
    return null
  }
}

export function getInstagramEmbedPath(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const parts = u.pathname.split('/').filter(Boolean)
    // /reel/CODE /p/CODE /tv/CODE
    const kind = parts[0]
    const code = parts[1]
    if (
      (kind === 'reel' || kind === 'p' || kind === 'tv') &&
      code
    ) {
      return `/${kind}/${code}/embed`
    }
    return null
  } catch {
    return null
  }
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeVideoId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}`
}

export function getTiktokEmbedUrl(url: string): string | null {
  const id = getTiktokVideoId(url)
  if (!id) return null
  return `https://www.tiktok.com/embed/v2/${id}`
}

export function getInstagramEmbedUrl(url: string): string | null {
  const path = getInstagramEmbedPath(url)
  if (!path) return null
  return `https://www.instagram.com${path}`
}

/** URL de iframe embed según plataforma, o null si no se puede embeber. */
export function getVideoEmbedUrl(
  url: string,
  tipo: VideoTipo,
): string | null {
  if (tipo === 'youtube') return getYoutubeEmbedUrl(url)
  if (tipo === 'tiktok') return getTiktokEmbedUrl(url)
  if (tipo === 'instagram') return getInstagramEmbedUrl(url)
  return null
}

export function videoEmbedAspect(tipo: VideoTipo): 'video' | 'portrait' {
  return tipo === 'youtube' ? 'video' : 'portrait'
}

export function productoTieneVideo(producto: {
  video_url?: string | null
  video_tipo?: VideoTipo | null
}): boolean {
  return Boolean(producto.video_url?.trim() && producto.video_tipo)
}

export function isLikelyVideoUrl(url: string, tipo: VideoTipo): boolean {
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, '').toLowerCase()
    if (tipo === 'youtube') {
      return (
        host === 'youtube.com' ||
        host === 'm.youtube.com' ||
        host === 'youtu.be' ||
        host === 'youtube-nocookie.com'
      )
    }
    if (tipo === 'tiktok') {
      return (
        host === 'tiktok.com' ||
        host === 'vm.tiktok.com' ||
        host.endsWith('.tiktok.com')
      )
    }
    if (tipo === 'instagram') {
      return (
        host === 'instagram.com' ||
        host === 'instagr.am' ||
        host.endsWith('.instagram.com')
      )
    }
    return false
  } catch {
    return false
  }
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
