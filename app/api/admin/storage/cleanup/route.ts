import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseSecret } from '@/lib/supabase-secret'
import { BUCKET_COMPROBANTES } from '@/lib/transferencia'
import { deleteImageObjects, listAllObjects } from '@/lib/r2'
import { findOrphans, r2Configured, referencedKeys } from '@/lib/storageServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Action = 'orders' | 'receipts' | 'r2_orphans' | 'legacy_images'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/**
 * Safe cleanups, one at a time. Never touches products, categories, banners,
 * settings or open orders. Each action re-checks everything on the server.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ ok: false, message: 'Solicitud no permitida.' }, { status: 403 })
  }
  if (!(await getAdminUser())) return NextResponse.json({ ok: false, message: 'Sin permiso.' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as
    | { action?: Action; cutoff?: string; confirm?: string; months?: number }
    | null
  const db = await createSupabaseServer()
  const secret = createSupabaseSecret()
  if (!secret) return NextResponse.json({ ok: false, message: 'Falta configurar la llave del servidor.' }, { status: 503 })

  const removeFromBucket = async (bucket: string, paths: string[]) => {
    let removed = 0
    for (const part of chunks(paths, 100)) {
      const { data, error } = await secret.storage.from(bucket).remove(part)
      if (error) throw new Error(error.message)
      removed += data?.length ?? 0
    }
    return removed
  }

  try {
    switch (body?.action) {
      case 'orders': {
        if (!DATE_RE.test(body.cutoff ?? '')) return NextResponse.json({ ok: false, message: 'Elige una fecha.' }, { status: 400 })
        const { data, error } = await db.rpc('admin_anonymize_orders', { p_cutoff: body.cutoff, p_confirm: body.confirm ?? '' })
        if (error) {
          const msg = error.message.includes('confirmation_required')
            ? 'Escribe LIMPIAR para confirmar.'
            : error.message.includes('cutoff_too_recent')
              ? 'Solo se puede limpiar el historial de hace más de 30 días.'
              : 'No se pudo limpiar. Intenta de nuevo.'
          return NextResponse.json({ ok: false, message: msg }, { status: 400 })
        }
        const result = data as { orders: number; receipts: string[] }
        const receipts = result.receipts.length ? await removeFromBucket(BUCKET_COMPROBANTES, result.receipts) : 0
        return NextResponse.json({
          ok: true,
          message: `Listo: se borraron los datos personales de ${result.orders} pedidos y ${receipts} comprobantes. Los productos y montos se conservan para tus reportes.`,
        })
      }

      case 'receipts': {
        const months = Math.min(60, Math.max(3, Number(body.months) || 12))
        const { data, error } = await db.rpc('admin_old_receipt_paths', { p_months: months })
        if (error) throw new Error(error.message)
        const paths = (data ?? []) as string[]
        const removed = paths.length ? await removeFromBucket(BUCKET_COMPROBANTES, paths) : 0
        return NextResponse.json({ ok: true, message: `Listo: se borraron ${removed} comprobantes de hace más de ${months} meses.` })
      }

      case 'r2_orphans': {
        if (!r2Configured()) return NextResponse.json({ ok: false, message: 'R2 no está configurado.' }, { status: 400 })
        // Fresh listing (not the cached one) right before deleting.
        const [objects, used] = await Promise.all([listAllObjects(), referencedKeys(db)])
        if (used.size === 0) {
          return NextResponse.json({ ok: false, message: 'Por seguridad no se borró nada: no se pudieron leer las imágenes en uso.' }, { status: 500 })
        }
        const orphans = findOrphans(objects, used)
        for (const part of chunks(orphans.map(o => o.key), 1000)) await deleteImageObjects(part)
        revalidateTag('r2-objects', 'max')
        return NextResponse.json({ ok: true, message: `Listo: se borraron ${orphans.length} archivos sin usar de R2.` })
      }

      case 'legacy_images': {
        const { data, error } = await db.rpc('admin_legacy_image_paths')
        if (error) throw new Error(error.message)
        const rows = (data ?? []) as { bucket: string; name: string }[]
        let removed = 0
        for (const bucket of ['productos', 'banners']) {
          const paths = rows.filter(r => r.bucket === bucket).map(r => r.name)
          if (paths.length) removed += await removeFromBucket(bucket, paths)
        }
        return NextResponse.json({ ok: true, message: `Listo: se borraron ${removed} imágenes antiguas de Supabase (ya están en R2).` })
      }

      default:
        return NextResponse.json({ ok: false, message: 'Acción inválida.' }, { status: 400 })
    }
  } catch (err) {
    console.error('[admin/storage/cleanup]', err)
    return NextResponse.json({ ok: false, message: 'No se pudo completar la limpieza. Intenta de nuevo.' }, { status: 500 })
  }
}
