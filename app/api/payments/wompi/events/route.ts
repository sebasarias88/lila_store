import { applyTransaction } from '@/lib/payments/apply'
import { parseTransaction, verifyEvent, wompiConfig } from '@/lib/payments/wompi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Wompi events URL (set it in the Wompi dashboard, one per environment):
 *   https://www.lilastore.com.co/api/payments/wompi/events
 *
 * Only correctly signed events are accepted. Wompi retries anything that is
 * not a 200, so a 500 is returned only when saving failed.
 */
const MAX_BODY = 64 * 1024

export async function POST(request: Request) {
  const config = wompiConfig()
  if (!config) return new Response(null, { status: 503 })

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY) return new Response(null, { status: 413 })
  const raw = await request.text()
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response(null, { status: 400 })
  }

  const event = verifyEvent(config, body, request.headers.get('x-event-checksum'))
  if (!event) {
    console.warn('[wompi] rejected event with an invalid signature')
    return new Response(null, { status: 401 })
  }
  if (event.event !== 'transaction.updated') return Response.json({ ok: true, ignored: true })

  const tx = parseTransaction(event.data.transaction)
  if (!tx) {
    console.error('[wompi] signed event with an unexpected shape')
    return Response.json({ ok: true, ignored: true })
  }

  const result = await applyTransaction(tx, event.event, body)
  if (result === 'db_error') return new Response(null, { status: 500 })
  if (result !== 'ok' && result !== 'duplicate') console.warn('[wompi] event', tx.reference, result)
  return Response.json({ ok: true })
}
