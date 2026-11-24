/** Applies a VERIFIED Wompi transaction to its order (server only). */
import { createSupabaseSecret } from '@/lib/supabase-secret'
import type { WompiTransaction } from '@/lib/payments/wompi'

export type ApplyResult =
  | 'ok'
  | 'duplicate'
  | 'order_not_found'
  | 'amount_mismatch'
  | 'already_paid'
  | 'invalid_currency'
  | 'db_error'

/** Idempotent: the database ignores repeats of the same transaction + status. */
export async function applyTransaction(tx: WompiTransaction, event: string, payload: unknown): Promise<ApplyResult> {
  if (tx.currency !== 'COP') return 'invalid_currency'
  const db = createSupabaseSecret()
  if (!db) return 'db_error'
  const { data, error } = await db.rpc('apply_payment_event', {
    p_event: event,
    p_transaction_id: tx.id,
    p_reference: tx.reference,
    p_status: tx.status,
    p_amount_in_cents: tx.amount_in_cents,
    p_payload: payload,
  })
  if (error) {
    console.error('[payments] apply_payment_event failed:', error.code, error.message)
    return 'db_error'
  }
  return data as ApplyResult
}

export type OrderPayment = {
  id: string
  order_number: number
  status: string
  payment_status: string
  total: number
}

export async function getOrderPayment(reference: string): Promise<OrderPayment | null> {
  const db = createSupabaseSecret()
  if (!db) return null
  const { data, error } = await db.rpc('get_order_payment', { p_reference: reference })
  if (error) console.error('[payments] order lookup failed:', error.message)
  return (data as OrderPayment | null) ?? null
}
