'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Heart, MapPin, MessageCircle, Sparkles, Truck } from 'lucide-react'
import { SUCURSALES, resolveWhatsAppNumero } from '@/lib/negocio'
import type { CatalogType } from '@/lib/catalog'
import { buildWhatsAppUrl, mensajeConsultaWhatsApp } from '@/lib/whatsapp'

type Props = {
  texto: string
  whatsapp?: string
  nombreNegocio?: string
  catalogType?: CatalogType
}

const DEFAULT_TEXTO =
  'Somos lila-store, tu aliada de belleza en el Quindío. En nuestras tiendas de Armenia y Quimbaya encuentras maquillaje, skincare y cuidados con atención cercana, y también te acompañamos con asesoría y envíos a toda Colombia.'

export default function NosotrosSection({
  texto,
  whatsapp,
  nombreNegocio = 'lila-store',
  catalogType = 'detal',
}: Props) {
  const whatsappUrl = buildWhatsAppUrl(
    resolveWhatsAppNumero(whatsapp),
    mensajeConsultaWhatsApp('nosotros', catalogType),
  )

  return (
    <section className="relative overflow-hidden bg-[var(--bg-muted)] py-12 sm:py-14">
      <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-6 h-44 w-44 rounded-full bg-[rgba(232,160,200,0.12)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[var(--shadow-soft)]">
            <Heart size={13} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">Nosotros</span>
            <Sparkles size={13} className="text-[var(--accent-secondary)]" />
          </div>

          <h2 className="max-w-2xl text-[1.85rem] font-bold leading-tight text-[var(--text-primary)] sm:text-[2.15rem]">
            Tu aliada de{' '}
            <span className="text-[var(--accent-primary)]">belleza</span>
          </h2>
          <p className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
            {nombreNegocio} — productos fresquitos con atención súper cercana 💕
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <p className="max-w-xl text-[15px] font-medium leading-[1.85] text-[var(--text-secondary)]">
              {texto || DEFAULT_TEXTO}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-[12px] font-bold text-[var(--accent-deep)] shadow-[var(--shadow-soft)]">
                <Truck size={14} className="text-[var(--accent-primary)]" />
                Envíos nacionales
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-[12px] font-bold text-[var(--accent-deep)] shadow-[var(--shadow-soft)]">
                <MessageCircle size={14} className="text-[var(--accent-primary)]" />
                Atención por WhatsApp
              </div>
            </div>

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
            className="rounded-[24px] border border-[var(--border)] bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-6"
          >
            <p className="mb-4 text-[13px] font-bold text-[var(--accent-deep)]">
              Nuestras tiendas
            </p>
            <ul className="space-y-3">
              {SUCURSALES.map((s, i) => (
                <li
                  key={`${s.ciudad}-${s.direccion}-${i}`}
                  className="flex gap-3 rounded-[18px] bg-gradient-to-br from-[#F9F6FF] to-[#EEE8FC] p-3.5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                    <MapPin size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--text-primary)]">
                      {s.ciudad}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-[var(--text-secondary)]">
                      {s.direccion}
                    </p>
                    {s.nota ? (
                      <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
                        {s.nota}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
