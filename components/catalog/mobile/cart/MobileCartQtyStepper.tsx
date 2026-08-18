'use client'

import { Minus, Plus } from 'lucide-react'

type MobileCartQtyStepperProps = {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  min?: number
  max?: number
  /** Mensaje bajo el stepper (ej. límite de stock) */
  hint?: string | null
}

export default function MobileCartQtyStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max,
  hint = null,
}: MobileCartQtyStepperProps) {
  const atMax = max != null && value >= max

  return (
    <div className="space-y-1">
      <div className="mobile-cart-qty" role="group" aria-label="Cantidad">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= min}
          className="mobile-cart-qty-btn mobile-cart-qty-btn--minus"
          aria-label="Disminuir cantidad"
        >
          <Minus size={14} strokeWidth={2.25} aria-hidden />
        </button>
        <span className="mobile-cart-qty-value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={atMax}
          className="mobile-cart-qty-btn mobile-cart-qty-btn--plus disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Aumentar cantidad"
        >
          <Plus size={14} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      {hint ? (
        <p className="text-[10px] font-medium leading-snug text-[var(--accent-deep)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
