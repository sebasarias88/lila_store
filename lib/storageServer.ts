/** Admin storage helpers (server only). */
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listAllObjects, isAllowedKey, getR2PublicBaseUrl, type R2Object } from '@/lib/r2'
import { thumbKeyFor, THUMB_PREFIX } from '@/lib/imageVariants'

/** New uploads are never treated as unused (the admin may be creating a product). */
export const ORPHAN_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Bucket listing cached 10 min: the panel can be reloaded without extra R2 requests. */
export const cachedR2Objects = unstable_cache(async () => listAllObjects(), ['r2-objects-v1'], {
  revalidate: 600,
  tags: ['r2-objects'],
})

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
  )
}

/** Keys still used by the store: originals, their thumbnails and videos. */
export async function referencedKeys(adminDb: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await adminDb.rpc('admin_referenced_media')
  if (error) throw new Error(error.message)
  const base = `${getR2PublicBaseUrl()}/`
  const keys = new Set<string>()
  for (const url of (data ?? []) as string[]) {
    if (typeof url !== 'string' || !url.startsWith(base)) continue
    const key = decodeURIComponent(url.slice(base.length).split('?')[0])
    keys.add(key)
    if (!key.startsWith(THUMB_PREFIX)) keys.add(thumbKeyFor(key))
  }
  return keys
}

export function findOrphans(objects: R2Object[], used: Set<string>, now = Date.now()): R2Object[] {
  return objects.filter(
    o => isAllowedKey(o.key) && !used.has(o.key) && now - o.lastModified > ORPHAN_MIN_AGE_MS,
  )
}

export function summarizeR2(objects: R2Object[]) {
  const byFolder = new Map<string, { files: number; bytes: number }>()
  let bytes = 0
  for (const o of objects) {
    bytes += o.size
    const folder = o.key.includes('/') ? o.key.split('/')[0] : '(raíz)'
    const f = byFolder.get(folder) ?? { files: 0, bytes: 0 }
    f.files++
    f.bytes += o.size
    byFolder.set(folder, f)
  }
  return {
    files: objects.length,
    bytes,
    folders: [...byFolder.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.bytes - a.bytes),
  }
}
