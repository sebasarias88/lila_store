import { ORDER_STATUS, PAYMENT_STATUS, type OrderStatus, type PaymentStatus } from '@/lib/orders/shared'

/** Only the store's own palette: lilac, pink, mint and rose. */
const TONES: Record<string, string> = {
  muted: 'border-[var(--border-input)] bg-[var(--bg-muted)] text-[var(--text-muted)]',
  // Needs attention → brand pink
  warning: 'border-[rgba(232,160,200,0.55)] bg-[rgba(232,160,200,0.16)] text-[#A8487E]',
  // In progress → brand lilac
  info: 'border-[rgba(169,137,224,0.45)] bg-[rgba(169,137,224,0.14)] text-[var(--accent-deep)]',
  accent: 'border-[rgba(169,137,224,0.45)] bg-[var(--bg-muted)] text-[var(--accent-deep)]',
  // Done → brand mint
  success: 'border-[rgba(143,217,182,0.7)] bg-[rgba(143,217,182,0.2)] text-[#2E7D5B]',
  // Problem → brand rose
  danger: 'border-[rgba(232,121,138,0.5)] bg-[rgba(232,121,138,0.12)] text-[#B83F55]',
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${TONES[tone] ?? TONES.muted}`}>
      {label}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: 'muted' }
  return <Badge label={s.label} tone={s.tone} />
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status] ?? { label: status, tone: 'muted' }
  return <Badge label={s.label} tone={s.tone} />
}
