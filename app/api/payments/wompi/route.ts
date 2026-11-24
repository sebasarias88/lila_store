import { NextResponse } from 'next/server'
import { wompiConfig } from '@/lib/payments/wompi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Tells the checkout whether online payment is available (no secrets exposed). */
export async function GET() {
  const config = wompiConfig()
  return NextResponse.json(
    { enabled: Boolean(config), sandbox: config?.env === 'sandbox' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
