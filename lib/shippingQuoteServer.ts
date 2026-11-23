import { unstable_cache } from 'next/cache'
import { createSupabasePublic } from '@/lib/supabase-public'
import { quoteShipping, type ShippingOption } from '@/lib/mipaquete'
import { buildShippingPackage } from '@/lib/shippingPackage'

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

/** Shipping options for a city (same result the checkout shows). Throws on API errors. */
export async function getShippingOptions(
  cityCode: string,
  subtotal: number,
  units: number,
): Promise<ShippingOption[]> {
  const pkg = buildShippingPackage(await getPackageConfig(), units)
  const pkgKey = [pkg.weightKg, pkg.lengthCm, pkg.widthCm, pkg.heightCm].join('|')
  // Insurance value rounded up to a bucket: fewer distinct quotes, never under-declared.
  const declaredValue = Math.ceil(subtotal / VALUE_BUCKET) * VALUE_BUCKET
  return pickOptions(await cachedQuote(cityCode, pkgKey, declaredValue))
}
