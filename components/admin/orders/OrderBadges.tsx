import { ORDER_STATUS, PAYMENT_STATUS, type OrderStatus, type PaymentStatus } from '@/lib/orders/shared'

const TONES: Record<string, string> = {
  muted: 'border-[var(--border-input)] bg-[var(--bg-muted)] text-[var(--text-muted)]',
  warning: 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.1)] text-amber-500',
  info: 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.1)] text-blue-500',
  accent: 'border-[rgba(169,137,224,0.4)] bg-[rgba(169,137,224,0.12)] text-[var(--accent-deep)]',
  success: 'border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.1)] text-emerald-500',
  danger: 'border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.1)] text-red-500',
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
