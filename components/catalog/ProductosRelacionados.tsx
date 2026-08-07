'use client'

import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { Producto } from '@/types'
import { type CatalogType } from '@/lib/catalog'
import ResponsiveProductCard from '@/components/catalog/mobile/ResponsiveProductCard'
import HorizontalCarousel from '@/components/ui/HorizontalCarousel'

export default function ProductosRelacionados({
  productos,
  catalogType = 'detal',
}: {
  productos: Producto[]
  catalogType?: CatalogType
}) {
  if (!productos.length) return null

  return (
    <section className="relative overflow-hidden bg-[var(--bg-muted)] py-12 sm:py-14">
      <div className="pointer-events-none absolute -left-8 top-8 h-40 w-40 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-6 h-44 w-44 rounded-full bg-[rgba(232,160,200,0.12)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-[var(--shadow-soft)]">
            <Heart size={13} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">
              También te puede gustar 💕
            </span>
            <Sparkles size={13} className="text-[var(--accent-secondary)]" />
          </div>
          <h2 className="text-[1.65rem] font-bold leading-none text-[var(--text-primary)] sm:text-[1.9rem]">
            Más tesoros <span className="text-[var(--accent-primary)]">para ti</span>
          </h2>
          <p className="mt-2 max-w-md text-[14px] font-medium text-[var(--text-secondary)]">
            Piezas cute que combinan perfecto con tu vibe ✨
          </p>
        </motion.div>

        {/* Mobile: carousel */}
        <div className="sm:hidden">
          <HorizontalCarousel
            itemClassName="w-[68vw]"
            gapClassName="gap-3"
          >
            {productos.map((producto, i) => (
              <motion.div
                key={producto.id}
                className="h-full overflow-hidden rounded-[22px]"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <ResponsiveProductCard producto={producto} catalogType={catalogType} />
              </motion.div>
            ))}
          </HorizontalCarousel>
        </div>

        {/* Desktop: grid */}
        <div className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {productos.slice(0, 4).map((producto, i) => (
            <motion.div
              key={producto.id}
              className="overflow-hidden rounded-[22px]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.05, 0.2) }}
            >
              <ResponsiveProductCard producto={producto} catalogType={catalogType} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
