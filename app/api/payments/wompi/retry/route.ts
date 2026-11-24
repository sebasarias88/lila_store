import { NextResponse } from 'next/server'
import { createSupabaseSecret } from '@/lib/supabase-secret'
import { checkoutUrl, newPaymentReference, wompiConfig } from '@/lib/payments/wompi'
import { siteOrigin } from '@/lib/payments/origin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** New payment attempt for an unpaid Wompi order (Wompi needs a new reference). */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ ok: false, message: 'Solicitud no permitida.' }, { status: 403 })
  }
  const config = wompiConfig()
  const db = createSupabaseSecret()
  if (!config || !db) {
    return NextResponse.json({ ok: false, message: 'El pago en línea no está disponible ahora.' }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { orderId?: unknown } | null
  const orderId = typeof body?.orderId === 'string' ? body.orderId : ''
  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ ok: false, message: 'Pedido inválido.' }, { status: 400 })
  }

  const { data: current } = await db.from('orders').select('order_number').eq('id', orderId).maybeSingle()
  const reference = newPaymentReference(current?.order_number ?? undefined)
  const { data, error } = await db.rpc('set_payment_reference', { p_order_id: orderId, p_reference: reference })
  if (error) {
    const known = error.message.includes('not_payable')
      ? 'Este pedido ya fue pagado o ya no se puede pagar en línea.'
      : 'No encontramos ese pedido.'
    return NextResponse.json({ ok: false, message: known }, { status: 400 })
  }
  const total = Number((data as { total: number }).total)
  return NextResponse.json({
    ok: true,
    checkoutUrl: checkoutUrl(config, {
      reference,
      amountInCents: total * 100,
      redirectUrl: `${siteOrigin(request)}/pago/resultado`,
    }),
  })
}
