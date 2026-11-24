import { NextResponse } from 'next/server'
import { DANE_CODE_RE, isMipaqueteConfigured } from '@/lib/mipaquete'
import { getShippingOptions } from '@/lib/shippingQuoteServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UNITS = 500
const MAX_SUBTOTAL = 50_000_000
/** Body: { cityCode: "05001000", subtotal: 120000, units: 3 } → { options: [...] } */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!isMipaqueteConfigured()) {
    return NextResponse.json({ error: 'not-configured' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as
    | { cityCode?: unknown; subtotal?: unknown; units?: unknown }
    | null
  const cityCode = typeof body?.cityCode === 'string' ? body.cityCode : ''
  const subtotal = Number(body?.subtotal)
  const units = Math.floor(Number(body?.units))
  if (
    !DANE_CODE_RE.test(cityCode) ||
    !Number.isFinite(subtotal) || subtotal <= 0 || subtotal > MAX_SUBTOTAL ||
    !Number.isFinite(units) || units < 1 || units > MAX_UNITS
  ) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  try {
    const options = await getShippingOptions(cityCode, subtotal, units)
    if (!options.length) return NextResponse.json({ error: 'no-coverage' }, { status: 404 })
    return NextResponse.json({ options }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[shipping/quote]', error)
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}
