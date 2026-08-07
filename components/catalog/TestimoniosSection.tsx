'use client'

import { motion } from 'framer-motion'
import { Heart, Quote, Sparkles } from 'lucide-react'
import HorizontalCarousel from '@/components/ui/HorizontalCarousel'

const TESTIMONIOS = [
  {
    nombre: 'María C.',
    ciudad: 'Armenia, Quindío',
    texto:
      'Pedí por WhatsApp y me llegó impecable. El cabello quedó suave desde el primer uso. Ya soy clienta fija.',
  },
  {
    nombre: 'Laura P.',
    ciudad: 'Pereira',
    texto:
      'Precios justos y productos originales. Me ayudaron a elegir el tratamiento ideal para mi tipo de cabello.',
  },
  {
    nombre: 'Camila R.',
    ciudad: 'Bogotá',
    texto:
      'El catálogo es clarísimo y el envío llegó rápido. Se nota que conocen de belleza de verdad.',
  },
  {
    nombre: 'Andrea M.',
    ciudad: 'Medellín',
    texto:
      'Excelente atención. Me recomendaron exactamente lo que necesitaba y el resultado se ve profesional.',
  },
  {
    nombre: 'Valentina S.',
    ciudad: 'Cali',
    texto:
      'Compré para mi salón y para uso personal. Calidad consistente y muy buena comunicación en cada pedido.',
  },
] as const

const CARD_TINTS = [
  'from-[#FBF8FF] to-[#EEE8FC]',
  'from-[#F9F6FF] to-[#F0EAFB]',
  'from-[#F5F0FC] to-[#E8E0FA]',
  'from-[#FBF8FF] to-[#F3EBFF]',
  'from-[#F9F6FF] to-[#F8EAF4]',
]

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="var(--accent-primary)">
          <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.4 6.5L12 16.9 5.9 20.3l1.4-6.5L2.4 9.3l6.6-.7L12 2.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimoniosSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--bg-base)] py-12 sm:py-14">
      <div className="pointer-events-none absolute -left-8 top-12 h-40 w-40 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-8 h-44 w-44 rounded-full bg-[rgba(232,160,200,0.12)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-1.5">
            <Heart size={13} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">Testimonios</span>
            <Sparkles size={13} className="text-[var(--accent-secondary)]" />
          </div>
          <h2 className="text-[1.85rem] font-bold text-[var(--text-primary)] sm:text-[2.15rem]">
            Lo que dicen{' '}
            <span className="text-[var(--accent-primary)]">nuestras clientas</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
            Historias cute de quienes ya compraron 💕
          </p>
        </motion.div>

        <HorizontalCarousel
          itemClassName="w-[85vw] sm:w-[320px] lg:w-[340px]"
          gapClassName="gap-4 sm:gap-5"
        >
          {TESTIMONIOS.map((t, i) => (
            <motion.article
              key={t.nombre}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              className={`flex h-full flex-col rounded-[24px] border border-[var(--border)] bg-gradient-to-br ${CARD_TINTS[i % CARD_TINTS.length]} p-6 shadow-[var(--shadow-soft)] sm:p-7`}
            >
              <Quote
                size={22}
                className="mb-4 text-[var(--accent-secondary)]"
                strokeWidth={1.5}
              />
              <Stars />
              <p className="mt-4 flex-1 text-[14px] font-medium leading-[1.75] text-[var(--text-secondary)]">
                “{t.texto}”
              </p>
              <div className="mt-6 border-t border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border))] pt-4">
                <p className="text-[14px] font-bold text-[var(--text-primary)]">
                  {t.nombre}
                </p>
                <p className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">
                  {t.ciudad}
                </p>
              </div>
            </motion.article>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  )
}
