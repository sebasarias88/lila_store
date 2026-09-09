'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  CreditCard,
  Package,
  MessageCircle,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const stepVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function StepConnector() {
  return (
    <div
      className="mx-1 mt-9 h-0 min-w-[16px] shrink-0 flex-1 border-t-2 border-dotted border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))] sm:min-w-[28px] lg:mx-0 lg:min-w-[12px]"
      aria-hidden
    />
  )
}

type Props = {
  catalogHref?: string
  /** Pasarela (detal) vs pedido por WhatsApp (mayoreo) */
  variant?: 'pasarela' | 'whatsapp'
}

const STEPS_PASARELA: { num: number; label: string; hint?: string; icon: LucideIcon }[] = [
  { num: 1, label: 'Elige tus favoritos', icon: ShoppingBag },
  { num: 2, label: 'Agrégalos al carrito', icon: ShoppingCart },
  { num: 3, label: 'Completa tus datos', icon: ClipboardList },
  {
    num: 4,
    label: 'Confirma tu pago',
    hint: 'Por WhatsApp ✨',
    icon: CreditCard,
  },
  { num: 5, label: '¡Recibe tu pedido!', icon: Package },
]

const STEPS_WHATSAPP: { num: number; label: string; hint?: string; icon: LucideIcon }[] = [
  { num: 1, label: 'Elige tus favoritos', icon: ShoppingBag },
  { num: 2, label: 'Agrégalos al carrito', icon: ShoppingCart },
  { num: 3, label: 'Completa tus datos', icon: ClipboardList },
  { num: 4, label: 'Escríbenos por WhatsApp', hint: 'Te ayudamos con cariño 💕', icon: MessageCircle },
  { num: 5, label: '¡Recibe tu pedido!', icon: Package },
]

export default function ProcesoPedido({
  catalogHref = '/productos',
  variant = 'pasarela',
}: Props) {
  const isPasarela = variant === 'pasarela'
  const STEPS = isPasarela ? STEPS_PASARELA : STEPS_WHATSAPP

  return (
    <section className="relative overflow-x-clip bg-[var(--bg-muted)] py-12 sm:py-14">
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-4 h-44 w-44 rounded-full bg-[rgba(232,160,200,0.12)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[var(--shadow-soft)]">
            <Sparkles size={13} className="text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">Cómo comprar ✨</span>
          </div>
          <h2 className="text-[1.65rem] font-bold text-[var(--text-primary)] sm:text-[2rem]">
            Tu pedido en{' '}
            <span className="text-[var(--accent-primary)]">5 pasitos</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[14px] font-medium text-[var(--text-secondary)]">
            {isPasarela
              ? 'Armas tu pedido cute y lo confirmamos juntas por WhatsApp 💕'
              : 'Armas tu pedido cute y lo confirmamos juntas por WhatsApp 💬'}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="flex items-start gap-0 overflow-x-auto overflow-y-hidden pb-2 pt-3 scrollbar-hide lg:overflow-visible lg:pb-0 lg:pt-1"
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <Fragment key={step.num}>
                <motion.div
                  variants={stepVariant}
                  className="flex w-[120px] shrink-0 flex-col items-center sm:w-[140px] lg:w-auto lg:min-w-0 lg:flex-1"
                >
                  <div className="relative">
                    <span className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[11px] font-bold text-white shadow-[var(--shadow-soft)]">
                      {step.num}
                    </span>
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
                      <Icon
                        size={22}
                        className="text-[var(--accent-deep)]"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <p className="mt-3 max-w-[120px] text-center text-[12px] font-bold leading-snug text-[var(--text-primary)] sm:max-w-[130px] sm:text-[13px]">
                    {step.label}
                  </p>
                  {step.hint ? (
                    <p className="mt-1 max-w-[130px] text-center text-[10px] font-medium leading-snug text-[var(--text-muted)] sm:text-[11px]">
                      {step.hint}
                    </p>
                  ) : null}
                </motion.div>
                {index < STEPS.length - 1 && <StepConnector />}
              </Fragment>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col items-center"
        >
          <Link
            href={catalogHref}
            className="catalog-gold-cta group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold"
          >
            Empezar a comprar ✨
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
