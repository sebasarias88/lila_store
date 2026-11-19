/**
 * Image variants served from Cloudflare R2.
 * Every catalog image `<base>/<key>` may have a lightweight thumbnail at
 * `<base>/thumbs/<key without extension>.webp` (max 640px), used by cards and lists.
 * Safe on client and server.
 */

export const THUMB_PREFIX = 'thumbs/'
export const THUMB_MAX_EDGE_PX = 640
export const THUMB_WEBP_QUALITY = 0.8

function imageBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '').replace(/\/$/, '')
}

/** Key of the thumbnail for an original image key (always .webp). */
export function thumbKeyFor(key: string): string {
  return `${THUMB_PREFIX}${key.replace(/\.[^./]+$/, '')}.webp`
}

/** Thumbnail URL for an R2 image URL; other URLs are returned unchanged. */
export function thumbUrl(url: string | null | undefined): string | null | undefined {
  const base = imageBaseUrl()
  if (!url || !base || !url.startsWith(`${base}/`)) return url
  const key = url.slice(base.length + 1)
  if (key.startsWith(THUMB_PREFIX)) return url
  return `${base}/${thumbKeyFor(key)}`
}
