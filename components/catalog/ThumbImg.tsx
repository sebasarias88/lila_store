'use client'

import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { thumbUrl } from '@/lib/imageVariants'

/**
 * Drop-in <img> for cards, lists, menus and the cart: loads the 640px R2
 * thumbnail (~60KB) and falls back to the full image if it doesn't exist.
 * Non-R2 URLs (e.g. legacy Supabase) are used as they are.
 */
export default function ThumbImg({
  src,
  alt = '',
  onError,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { src?: string | null }) {
  const full = typeof src === 'string' ? src : undefined
  const preferred = thumbUrl(full) ?? undefined
  const [useFull, setUseFull] = useState(false)
  const [lastSrc, setLastSrc] = useState(full)
  if (full !== lastSrc) {
    setLastSrc(full)
    setUseFull(false)
  }
  const current = useFull ? full : preferred

  const fallback = () => {
    if (!useFull && preferred !== full) setUseFull(true)
  }

  // A thumbnail that fails before hydration never fires onError: check on mount.
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) fallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the source changes
  }, [current])

  if (!current) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images are pre-optimized on R2
    <img
      ref={ref}
      src={current}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={e => {
        fallback()
        onError?.(e)
      }}
      {...rest}
    />
  )
}
