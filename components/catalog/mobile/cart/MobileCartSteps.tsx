'use client'

import { Check } from 'lucide-react'

type Step = 'carrito' | 'datos' | 'resumen'

const STEPS: { id: Step; label: string }[] = [
  { id: 'carrito', label: 'Carrito' },
  { id: 'datos', label: 'Datos' },
  { id: 'resumen', label: 'Confirmar' },
]

type MobileCartStepsProps = {
  step: Step
  stepIndex: number
  onStepClick: (step: Step) => void
}

export default function MobileCartSteps({ step, stepIndex, onStepClick }: MobileCartStepsProps) {
  return (
    <nav className="mobile-cart-steps" aria-label="Pasos del pedido">
      <ol className="flex w-full items-start">
        {STEPS.map((s, i) => {
          const isActive = step === s.id
          const isDone = i < stepIndex
          const isClickable = i < stepIndex
          const leftConnectorActive = i > 0 && stepIndex >= i
          const rightConnectorActive = i < STEPS.length - 1 && stepIndex > i

          return (
            <li key={s.id} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`mobile-cart-steps-connector h-[2px] flex-1 ${
                    i === 0
                      ? 'opacity-0'
                      : leftConnectorActive
                        ? 'mobile-cart-steps-connector--active'
                        : ''
                  }`}
                  aria-hidden
                />

                <span
                  className={`mobile-cart-steps-node relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-white text-[var(--accent-deep)]'
                      : isDone
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                        : 'border-[var(--border)] bg-white text-[var(--text-subtle)]'
                  } ${!isActive && !isDone ? 'opacity-50' : ''}`}
                  aria-hidden
                >
                  {isDone && !isActive ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className="text-[11px] font-bold tabular-nums">{i + 1}</span>
                  )}
                </span>

                <div
                  className={`mobile-cart-steps-connector h-[2px] flex-1 ${
                    i === STEPS.length - 1
                      ? 'opacity-0'
                      : rightConnectorActive
                        ? 'mobile-cart-steps-connector--active'
                        : ''
                  }`}
                  aria-hidden
                />
              </div>

              <button
                type="button"
                disabled={!isClickable && !isActive}
                onClick={() => isClickable && onStepClick(s.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`mt-2.5 max-w-[5.5rem] text-center text-[11px] font-bold leading-tight transition-colors disabled:cursor-default ${
                  isActive
                    ? 'text-[var(--accent-deep)]'
                    : isDone
                      ? 'text-[var(--text-secondary)] enabled:active:text-[var(--accent-deep)]'
                      : 'text-[var(--text-faint)]'
                }`}
              >
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type { Step }
