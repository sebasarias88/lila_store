'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowUpRight, Heart, Sparkles } from 'lucide-react'
import { Promocion } from '@/types'

function isPromoActive(promo: Promocion) {
  const now = new Date()
  if (promo.fecha_inicio && new Date(promo.fecha_inicio) > now) return false
  if (promo.fecha_fin && new Date(promo.fecha_fin) < now) return false
  return true
}

export default function PromoStrip({ promociones }: { promociones: Promocion[] }) {
  if (!promociones.length) return null

  const activas = promociones.filter(isPromoActive)
  if (!activas.length) return null

  const featured = activas.slice(0, 3)
  const rest = activas.slice(3)

  return (
    <section className="relative overflow-hidden bg-[var(--bg-base)] py-12 sm:py-14">
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-[70%] -translate-x-1/2 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[12px] font-bold text-[var(--accent-deep)] shadow-[var(--shadow-soft)]">
              <Sparkles size={13} className="text-[var(--accent-primary)]" />
              Campañas cute
            </p>
            <h2 className="text-[1.85rem] font-bold text-[var(--text-primary)] sm:text-[2.15rem]">
              Promociones{' '}
              <span className="text-[var(--accent-primary)]">del momento</span>
            </h2>
            <p className="mt-2 max-w-md text-[14px] font-medium text-[var(--text-secondary)]">
              Lanzamientos y descuentos para consentirte ✨
            </p>
          </div>
        </motion.div>

        <div
          className={`grid gap-4 ${
            featured.length === 1
              ? 'grid-cols-1'
              : featured.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {featured.map((promo, i) => {
            const inner = (
              <>
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#EEE8FC] to-[#F0EAFB] sm:aspect-[5/3]">
                  {promo.imagen_url ? (
                    <img
                      src={promo.imagen_url}
                      alt={promo.titulo}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Heart
                        size={36}
                        className="text-[var(--accent-primary)] opacity-50"
                        fill="currentColor"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(110,79,168,0.72)] via-[rgba(110,79,168,0.15)] to-transparent" />

                  {promo.badge_texto && (
                    <span
                      className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-[var(--shadow-soft)]"
                      style={{ backgroundColor: promo.badge_color || 'var(--accent-primary)' }}
                    >
                      {promo.badge_texto}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-[18px] font-bold text-white sm:text-[19px]">
                      {promo.titulo}
                    </p>
                    {promo.descripcion && (
                      <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-relaxed text-white/90">
                        {promo.descripcion}
                      </p>
                    )}
                    {promo.enlace && (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                        Ver oferta
                        <ArrowUpRight size={13} />
                      </span>
                    )}
                  </div>
                </div>
              </>
            )

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                {promo.enlace ? (
                  <Link
                    href={promo.enlace}
                    className="group block overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]">
                    {inner}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {rest.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {rest.map(promo => {
              const chip = (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-[13px] font-bold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]">
                  {promo.badge_texto && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: promo.badge_color || 'var(--accent-primary)' }}
                    >
                      {promo.badge_texto}
                    </span>
                  )}
                  {promo.titulo}
                </span>
              )
              return promo.enlace ? (
                <Link key={promo.id} href={promo.enlace}>
                  {chip}
                </Link>
              ) : (
                <span key={promo.id}>{chip}</span>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
