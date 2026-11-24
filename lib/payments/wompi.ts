/**
 * Wompi (Grupo Bancolombia) — Web Checkout by redirect. SERVER ONLY.
 *
 * Environment variables (Vercel):
 *   WOMPI_ENV               sandbox | production
 *   WOMPI_PUBLIC_KEY        pub_test_… / pub_prod_…
 *   WOMPI_INTEGRITY_SECRET  test_integrity_… / prod_integrity_…   (Sensitive)
 *   WOMPI_EVENTS_SECRET     test_events_… / prod_events_…         (Sensitive)
 *
 * The private key is not needed: the server only signs the checkout and reads
 * public transaction data. Customers' card/bank data never touch our server.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export type WompiConfig = {
  env: 'sandbox' | 'production'
  publicKey: string
  integritySecret: string
  eventsSecret: string
  apiBase: string
}

const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, '').trim() || undefined
let warned = false

/** Returns the config, or null when online payments are off / misconfigured. */
export function wompiConfig(): WompiConfig | null {
  if (typeof window !== 'undefined') throw new Error('wompiConfig() is server-only')
  const env = clean(process.env.WOMPI_ENV)
  const publicKey = clean(process.env.WOMPI_PUBLIC_KEY)
  const integritySecret = clean(process.env.WOMPI_INTEGRITY_SECRET)
  const eventsSecret = clean(process.env.WOMPI_EVENTS_SECRET)
  if (!env || !publicKey || !integritySecret || !eventsSecret) return null

  const tag = env === 'production' ? 'prod' : 'test'
  const problem =
    env !== 'sandbox' && env !== 'production'
      ? "WOMPI_ENV must be 'sandbox' or 'production'"
      : !publicKey.startsWith(`pub_${tag}_`)
        ? `WOMPI_PUBLIC_KEY must start with pub_${tag}_`
        : !integritySecret.startsWith(`${tag}_integrity_`)
          ? `WOMPI_INTEGRITY_SECRET must start with ${tag}_integrity_`
          : !eventsSecret.startsWith(`${tag}_events_`)
            ? `WOMPI_EVENTS_SECRET must start with ${tag}_events_`
            : null
  if (problem) {
    // Never log the values, only which variable is wrong. Online payments stay off.
    if (!warned) console.error('[wompi] disabled:', problem)
    warned = true
    return null
  }
  return {
    env: env as WompiConfig['env'],
    publicKey,
    integritySecret,
    eventsSecret,
    apiBase: env === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1',
  }
}

const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a.toLowerCase(), 'utf8')
  const bb = Buffer.from(b.toLowerCase(), 'utf8')
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Unique reference per payment attempt, e.g. LILA-1042-7F3K9Q2M. */
export function newPaymentReference(orderNumber?: number): string {
  const rand = randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
  return orderNumber ? `LILA-${orderNumber}-${rand}` : `LILA-P-${rand}`
}

export const PAYMENT_REFERENCE_RE = /^LILA-[A-Z0-9-]{3,30}$/

/** Wompi's hosted checkout URL. Amount and reference are signed server-side. */
export function checkoutUrl(
  config: WompiConfig,
  order: { reference: string; amountInCents: number; redirectUrl: string },
): string {
  const currency = 'COP'
  const signature = sha256(`${order.reference}${order.amountInCents}${currency}${config.integritySecret}`)
  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', config.publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', String(order.amountInCents))
  url.searchParams.set('reference', order.reference)
  url.searchParams.set('signature:integrity', signature)
  url.searchParams.set('redirect-url', order.redirectUrl)
  // No customer data in the URL on purpose: Wompi asks for it on its own page.
  return url.toString()
}

export type WompiTransaction = {
  id: string
  status: string
  reference: string
  amount_in_cents: number
  currency: string
}

export const isTransactionId = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9-]{5,80}$/.test(id)

export function parseTransaction(value: unknown): WompiTransaction | null {
  if (!value || typeof value !== 'object') return null
  const t = value as Record<string, unknown>
  if (
    !isTransactionId(t.id) ||
    typeof t.status !== 'string' || t.status.length > 30 ||
    typeof t.reference !== 'string' || t.reference.length > 40 ||
    typeof t.amount_in_cents !== 'number' || !Number.isInteger(t.amount_in_cents) || t.amount_in_cents < 0 ||
    typeof t.currency !== 'string' || t.currency.length > 5
  ) {
    return null
  }
  return {
    id: t.id,
    status: t.status,
    reference: t.reference,
    amount_in_cents: t.amount_in_cents,
    currency: t.currency,
  }
}

/** Reads a transaction straight from Wompi's API (source of truth, never the URL). */
export async function fetchTransaction(
  config: WompiConfig,
  id: string,
): Promise<{ tx: WompiTransaction; raw: unknown } | null> {
  if (!isTransactionId(id)) return null
  try {
    const res = await fetch(`${config.apiBase}/transactions/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: unknown }
    const tx = parseTransaction(body.data)
    return tx ? { tx, raw: body.data } : null
  } catch (e) {
    console.error('[wompi] transaction lookup failed:', e instanceof Error ? e.message : e)
    return null
  }
}

export type WompiEvent = {
  event: string
  data: Record<string, unknown>
  signature: { properties: string[]; checksum: string }
  timestamp: number
}

function readPath(data: Record<string, unknown>, path: string): string {
  let current: unknown = data
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) return ''
    current = (current as Record<string, unknown>)[key]
  }
  return current === null || current === undefined ? '' : String(current)
}

/**
 * Verifies an event exactly as Wompi documents it:
 * SHA256(values of signature.properties in order + timestamp + events secret).
 */
export function verifyEvent(config: WompiConfig, body: unknown, headerChecksum: string | null): WompiEvent | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const sig = b.signature as Record<string, unknown> | undefined
  if (
    typeof b.event !== 'string' || b.event.length > 60 ||
    !b.data || typeof b.data !== 'object' ||
    typeof b.timestamp !== 'number' || !Number.isInteger(b.timestamp) ||
    !sig || !Array.isArray(sig.properties) || sig.properties.length < 1 || sig.properties.length > 20 ||
    !sig.properties.every(p => typeof p === 'string' && p.length <= 80) ||
    typeof sig.checksum !== 'string' || sig.checksum.length > 128
  ) {
    return null
  }
  const event: WompiEvent = {
    event: b.event,
    data: b.data as Record<string, unknown>,
    signature: { properties: sig.properties as string[], checksum: sig.checksum },
    timestamp: b.timestamp,
  }
  const values = event.signature.properties.map(p => readPath(event.data, p)).join('')
  const expected = sha256(`${values}${event.timestamp}${config.eventsSecret}`)
  const received = headerChecksum?.trim() || event.signature.checksum
  if (!safeEqualHex(expected, received)) return null
  if (headerChecksum && !safeEqualHex(headerChecksum.trim(), event.signature.checksum)) return null
  return event
}
