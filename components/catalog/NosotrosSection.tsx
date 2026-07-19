'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MapPin, MessageCircle, Truck } from 'lucide-react'
import { DIRECCION_NEGOCIO, CIUDAD_NEGOCIO } from '@/lib/negocio'
import type { CatalogType } from '@/lib/catalog'
import { buildWhatsAppUrl, mensajeConsultaWhatsApp } from '@/lib/whatsapp'

type Props = {
  texto: string
  whatsapp?: string
  nombreNegocio?: string
  catalogType?: CatalogType
}

const DEFAULT_TEXTO =
  `Somos lila-store, tu aliado de belleza en ${CIUDAD_NEGOCIO}. Visítanos en ${DIRECCION_NEGOCIO}. Contamos con una amplia variedad de productos profesionales para el cuidado capilar y personal.`

const HIGHLIGHTS = [
  {
    icon: MapPin,
    title: CIUDAD_NEGOCIO,
    description: DIRECCION_NEGOCIO,
  },
  {
    icon: Truck,
    title: 'Envíos nacionales',
    description: 'Llevamos tus productos a toda Colombia',
  },
  {
    icon: MessageCircle,
    title: 'Atención directa',
    description: 'Escríbenos y te asesoramos con gusto',
  },
] as const

export default function NosotrosSection({
  texto,
  whatsapp = '573185867702',
  nombreNegocio = 'lila-store',
  catalogType = 'detal',
}: Props) {
  const whatsappUrl = buildWhatsAppUrl(
    whatsapp,
    mensajeConsultaWhatsApp('nosotros', catalogType),
  )

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="catalog-eyebrow">Nosotros</span>
        </div>

        <h2 className="catalog-section-title max-w-2xl text-[1.85rem] leading-tight sm:text-[2.15rem]">
          Tu aliada de{' '}
          <span className="catalog-section-accent">belleza</span>
        </h2>
        <p className="mt-3 max-w-lg text-[14px] catalog-lead leading-relaxed">
          {nombreNegocio} — productos frescos con atención cercana 💕
        </p>
      </motion.div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          <p className="max-w-xl text-[15px] catalog-lead leading-[1.85] text-[var(--text-secondary)]">
            {texto || DEFAULT_TEXTO}
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="catalog-gold-cta group mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[13px] font-bold"
          >
            <MessageCircle size={15} />
            Contáctanos por WhatsApp
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8"
        >
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.06 }}
                className="flex gap-4 rounded-[16px] bg-[var(--bg-muted)] p-4"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent-primary)] text-white"
                  style={{ borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%' }}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">
                    {title}
                  </p>
                  <p className="mt-1 text-[13px] catalog-lead leading-relaxed">
                    {description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
