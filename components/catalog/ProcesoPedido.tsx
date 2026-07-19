'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Clock,
  CreditCard,
  Package,
  type LucideIcon,
} from 'lucide-react'

const STEPS: { num: number; label: string; icon: LucideIcon }[] = [
  { num: 1, label: 'Elige tus productos', icon: ShoppingBag },
  { num: 2, label: 'Agrega al carrito', icon: ShoppingCart },
  { num: 3, label: 'Completa tus datos', icon: ClipboardList },
  { num: 4, label: 'Espera confirmación', icon: Clock },
  { num: 5, label: 'Realiza tu pago', icon: CreditCard },
  { num: 6, label: 'Recibe tu pedido', icon: Package },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const stepVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function StepConnector() {
  return (
    <div
      className="mx-1 mt-7 h-0 min-w-[28px] shrink-0 flex-1 border-t-2 border-dotted border-[var(--border)] sm:min-w-[40px] lg:mx-0 lg:min-w-[16px]"
      aria-hidden
    />
  )
}

export default function ProcesoPedido() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="catalog-eyebrow">Cómo comprar</span>
        </div>
        <h2 className="catalog-section-title text-[1.5rem] sm:text-[1.85rem]">
          Tu pedido en <span className="catalog-section-accent">6 pasos</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] font-medium text-[var(--text-secondary)]">
          Proceso simple vía catálogo y WhatsApp 💬
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="flex items-start gap-0 overflow-x-auto pb-2 scrollbar-hide lg:overflow-visible lg:pb-0"
      >
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <Fragment key={step.num}>
              <motion.div
                variants={stepVariant}
                className="flex w-[108px] shrink-0 flex-col items-center sm:w-[128px] lg:w-auto lg:min-w-0 lg:flex-1"
              >
                <div className="relative">
                  <span className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-deep)] text-[10px] font-bold text-white shadow-[var(--shadow-soft)]">
                    {step.num}
                  </span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] shadow-[var(--shadow-soft)]">
                    <Icon size={20} className="text-[var(--accent-primary)]" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="mt-3 max-w-[100px] text-center text-[11px] font-bold leading-snug text-[var(--text-secondary)] sm:max-w-[120px] sm:text-[12px]">
                  {step.label}
                </p>
              </motion.div>
              {index < STEPS.length - 1 && <StepConnector />}
            </Fragment>
          )
        })}
      </motion.div>
    </section>
  )
}
