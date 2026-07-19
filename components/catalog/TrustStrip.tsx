'use client'

import { motion } from 'framer-motion'
import { Gift, MessageCircle, Sparkles, Truck } from 'lucide-react'

const ITEMS = [
  {
    icon: Truck,
    title: 'Envíos nacionales',
    desc: 'Llegamos a toda Colombia',
  },
  {
    icon: MessageCircle,
    title: 'Compra fácil',
    desc: 'Te ayudamos por WhatsApp',
  },
  {
    icon: Sparkles,
    title: 'Nuevos favoritos',
    desc: 'Tendencias cada semana',
  },
  {
    icon: Gift,
    title: 'Promos lindas',
    desc: 'Descuentos para consentirte',
  },
] as const

export default function TrustStrip() {
  return (
    <section className="bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, desc }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="relative flex min-h-[108px] items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--bg-muted)] text-[var(--accent-deep)]"
                style={{
                  borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%',
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight text-[var(--text-primary)] sm:text-[13px]">
                  {title}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-[var(--text-muted)] sm:text-[12px]">
                  {desc}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
