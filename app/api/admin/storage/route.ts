import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { cachedR2Objects, findOrphans, r2Configured, referencedKeys, summarizeR2 } from '@/lib/storageServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Usage of the free tiers + what each cleanup would free. Admin only. */
export async function GET(request: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const url = new URL(request.url)
  const cutoff = DATE_RE.test(url.searchParams.get('cutoff') ?? '') ? url.searchParams.get('cutoff')! : null
  const months = Math.min(60, Math.max(3, Number(url.searchParams.get('months')) || 12))

  const db = await createSupabaseServer()
  const defaultCutoff = new Date(Date.now() - 730 * 86400000).toISOString().slice(0, 10)
  const [usage, preview] = await Promise.all([
    db.rpc('admin_storage_usage'),
    db.rpc('admin_cleanup_preview', { p_cutoff: cutoff ?? defaultCutoff, p_receipt_months: months }),
  ])
  if (usage.error || preview.error) {
    console.error('[admin/storage]', usage.error || preview.error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  let r2: null | (ReturnType<typeof summarizeR2> & { orphans: { files: number; bytes: number } }) = null
  if (r2Configured()) {
    try {
      const [objects, used] = await Promise.all([cachedR2Objects(), referencedKeys(db)])
      const orphans = findOrphans(objects, used)
      r2 = {
        ...summarizeR2(objects),
        orphans: { files: orphans.length, bytes: orphans.reduce((a, o) => a + o.size, 0) },
      }
    } catch (err) {
      console.error('[admin/storage] r2', err)
    }
  }

  return NextResponse.json(
    { usage: usage.data, preview: preview.data, r2, cutoff: cutoff ?? defaultCutoff, months },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
