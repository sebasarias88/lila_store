'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
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
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-8 shadow-[var(--shadow-soft)] sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-7"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">
              También te puede gustar
            </span>
          </div>
          <h2 className="text-[1.65rem] font-bold leading-none text-[var(--text-primary)] sm:text-[1.9rem]">
            Productos relacionados
          </h2>
        </motion.div>

        <HorizontalCarousel
          itemClassName="w-[68vw] sm:w-[240px] lg:w-[260px]"
          gapClassName="gap-3 sm:gap-4"
        >
          {productos.map((producto, i) => (
            <motion.div
              key={producto.id}
              className="h-full"
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
    </section>
  )
}
