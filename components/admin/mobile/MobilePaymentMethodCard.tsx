'use client'

import { Trash2 } from 'lucide-react'

type MobilePaymentMethodCardProps = {
  metodo: string
  onRemove: () => void
}

export default function MobilePaymentMethodCard({
  metodo,
  onRemove,
}: MobilePaymentMethodCardProps) {
  return (
    <div className="mobile-admin-payment-card flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-[rgba(169,137,224,0.16)] bg-[var(--bg-muted)] px-4 py-3.5">
      <span className="min-w-0 flex-1 truncate text-[14px] font-light text-[var(--text-primary)]">
        {metodo}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.6px] text-[var(--text-muted)] active:bg-[rgba(248,113,113,0.1)] active:text-red-400"
        aria-label={`Eliminar ${metodo}`}
      >
        <Trash2 size={13} />
        Quitar
      </button>
    </div>
  )
}
