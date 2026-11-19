import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createSupabasePublic } from '@/lib/supabase-public'
import {
  DANE_CODE_RE,
  isMipaqueteConfigured,
  quoteShipping,
  type ShippingOption,
} from '@/lib/mipaquete'
import { buildShippingPackage } from '@/lib/shippingPackage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UNITS = 500
const MAX_SUBTOTAL = 50_000_000
/** Quotes are cached per city / box / value bucket so repeated visits don't call Mipaquete. */
const VALUE_BUCKET = 50_000

const getPackageConfig = unstable_cache(
  async () => {
    const { data, error } = await createSupabasePublic()
      .from('configuracion')
      .select('clave, valor')
      .like('clave', 'envio_paquete_%')
    if (error) throw new Error(error.message)
    return Object.fromEntries((data ?? []).map(r => [r.clave, r.valor])) as Record<string, string>
  },
  ['shipping-package-config'],
  { revalidate: 300 },
)

const cachedQuote = unstable_cache(
  async (destinyCode: string, pkgKey: string, declaredValue: number) => {
    const [weightKg, lengthCm, widthCm, heightCm] = pkgKey.split('|').map(Number)
    return quoteShipping({ destinyCode, pkg: { weightKg, lengthCm, widthCm, heightCm }, declaredValue })
  },
  ['mipaquete-quote-v1'],
  { revalidate: 60 * 60 * 6 },
)

/** Up to 3 choices: the cheapest, the fastest, and the next cheapest. */
function pickOptions(options: ShippingOption[]): ShippingOption[] {
  if (options.length <= 3) return options
  const cheapest = options[0]
  const fastest = [...options]
    .filter(o => o.days != null)
    .sort((a, b) => (a.days! - b.days!) || a.cost - b.cost)[0]
  const picked = [cheapest, fastest, ...options].filter(
    (o, i, all): o is ShippingOption => Boolean(o) && all.findIndex(x => x?.id === o!.id) === i,
  )
  return picked.slice(0, 3).sort((a, b) => a.cost - b.cost)
}

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
    const pkg = buildShippingPackage(await getPackageConfig(), units)
    const pkgKey = [pkg.weightKg, pkg.lengthCm, pkg.widthCm, pkg.heightCm].join('|')
    // Insurance value rounded up to a bucket: fewer distinct quotes, never under-declared.
    const declaredValue = Math.ceil(subtotal / VALUE_BUCKET) * VALUE_BUCKET
    const options = pickOptions(await cachedQuote(cityCode, pkgKey, declaredValue))
    if (!options.length) return NextResponse.json({ error: 'no-coverage' }, { status: 404 })
    return NextResponse.json({ options }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[shipping/quote]', error)
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}
