import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { fetchShippingCities, isMipaqueteConfigured } from '@/lib/mipaquete'

export const runtime = 'nodejs'

/** Municipalities change rarely: cache Mipaquete's list for a week. */
const getCities = unstable_cache(fetchShippingCities, ['mipaquete-cities-v1'], {
  revalidate: 60 * 60 * 24 * 7,
})

/** Public list of destination cities (name, department, DANE code) for the checkout. */
export async function GET() {
  if (!isMipaqueteConfigured()) {
    return NextResponse.json({ error: 'not-configured' }, { status: 503 })
  }
  try {
    const cities = await getCities()
    return NextResponse.json(
      { cities },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' } },
    )
  } catch (error) {
    console.error('[shipping/cities]', error)
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}
