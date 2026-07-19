'use client'

import { Minus, Plus } from 'lucide-react'

type MobileCartQtyStepperProps = {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  min?: number
}

export default function MobileCartQtyStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
}: MobileCartQtyStepperProps) {
  return (
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
        className="mobile-cart-qty-btn mobile-cart-qty-btn--plus"
        aria-label="Aumentar cantidad"
      >
        <Plus size={14} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  )
}
