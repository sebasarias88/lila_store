import { NextResponse, type NextRequest } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { BUCKET_COMPROBANTES, COMPROBANTE_PATH_RE } from '@/lib/transferencia'

export const dynamic = 'force-dynamic'

/**
 * Opens a customer's transfer receipt. The WhatsApp order links here instead
 * of to the file itself: only a signed-in admin gets a short-lived signed URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params
  const path = segments.map(decodeURIComponent).join('/')

  if (!COMPROBANTE_PATH_RE.test(path)) {
    return new NextResponse('Comprobante no encontrado', { status: 404 })
  }

  const admin = await getAdminUser()
  if (!admin) {
    const login = new URL('/admin/login', request.url)
    login.searchParams.set('next', `/admin/comprobantes/${path}`)
    return NextResponse.redirect(login)
  }

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.storage
    .from(BUCKET_COMPROBANTES)
    .createSignedUrl(path, 120)

  if (error || !data?.signedUrl) {
    return new NextResponse('Comprobante no encontrado', { status: 404 })
  }

  const response = NextResponse.redirect(data.signedUrl)
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
