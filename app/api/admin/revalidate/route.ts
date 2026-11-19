import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/adminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Called by the admin panel right after saving anything, so the public store
 * shows the change immediately instead of waiting for the 60s ISR window.
 * Admin-only. Pages regenerate lazily on their next visit.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }

  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  revalidatePath('/', 'layout')
  return NextResponse.json({ revalidated: true })
}
