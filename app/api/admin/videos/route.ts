import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { IMMUTABLE_CACHE_CONTROL, createVideoUploadUrl, publicUrlForKey } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_VIDEO_BYTES = 80 * 1024 * 1024
const EXTENSION_BY_TYPE: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/**
 * Admin-only. Returns a signed URL (valid 10 min) to upload ONE optimized video
 * straight to R2, plus the public URL it will have. Body: { contentType, size }.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }

  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let contentType: unknown
  let size: unknown
  try {
    ;({ contentType, size } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const extension = typeof contentType === 'string' ? EXTENSION_BY_TYPE[contentType] : undefined
  if (!extension) return NextResponse.json({ error: 'Formato no permitido (MP4 o WebM)' }, { status: 415 })
  if (typeof size !== 'number' || size <= 0 || size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: 'El video supera 80MB' }, { status: 413 })
  }

  const key = `videos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`

  try {
    const uploadUrl = await createVideoUploadUrl({ key, contentType: contentType as string })
    return NextResponse.json({
      uploadUrl,
      publicUrl: publicUrlForKey(key),
      headers: { 'Content-Type': contentType, 'Cache-Control': IMMUTABLE_CACHE_CONTROL },
    })
  } catch (error) {
    console.error('[admin/videos] presign failed', error)
    return NextResponse.json({ error: 'No se pudo preparar la subida' }, { status: 502 })
  }
}
