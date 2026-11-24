import type { Metadata } from 'next'
import { applyTransaction, getOrderPayment } from '@/lib/payments/apply'
import { fetchTransaction, isTransactionId, PAYMENT_REFERENCE_RE, wompiConfig } from '@/lib/payments/wompi'
import { orderCode } from '@/lib/orders/shared'
import PaymentResult, { type PaymentResultState } from '@/components/catalog/cart/PaymentResult'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resultado del pago',
  robots: { index: false, follow: false },
}

/**
 * Wompi sends the customer back here with ?id=<transaction id>.
 * The status is read from Wompi's API (never trusted from the URL) and applied
 * to the order, so it is updated even if the webhook arrives later.
 */
export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const config = wompiConfig()

  let state: PaymentResultState = 'unknown'
  let code: string | null = null
  let orderId: string | null = null

  if (config && isTransactionId(id)) {
    const found = await fetchTransaction(config, id)
    if (found && PAYMENT_REFERENCE_RE.test(found.tx.reference)) {
      await applyTransaction(found.tx, 'redirect', found.raw)
      const order = await getOrderPayment(found.tx.reference)
      if (order) {
        code = orderCode(order.order_number)
        orderId = order.id
        const status = found.tx.status.toUpperCase()
        state =
          order.payment_status === 'approved'
            ? 'approved'
            : status === 'PENDING'
              ? 'pending'
              : status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR'
                ? 'declined'
                : 'pending'
      }
    }
  }

  return (
    <div className="relative min-h-[70vh] bg-[var(--bg-base)] px-5 pb-16 pt-28 max-md:pt-[7rem] sm:pt-32">
      <div className="mx-auto max-w-lg">
        <PaymentResult state={state} orderCode={code} orderId={orderId} />
      </div>
    </div>
  )
}
