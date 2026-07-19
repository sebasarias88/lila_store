'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ShoppingBag, ArrowRight } from 'lucide-react'
import { Producto } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import MobileBottomSheet from '@/components/catalog/mobile/MobileBottomSheet'

type MobileQuickAddSheetProps = {
  open: boolean
  onClose: () => void
  producto: Producto | null
  catalogType?: CatalogType
}

export default function MobileQuickAddSheet({
  open,
  onClose,
  producto,
  catalogType = 'detal',
}: MobileQuickAddSheetProps) {
  if (!producto) return null

  const carritoHref = catalogPath(catalogType, '/carrito')

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title="Agregado al carrito"
      height="auto"
      showClose={false}
    >
      <div className="px-5 pb-6 pt-2">
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3">
          <div className="mobile-catalog-thumb relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-surface)]">
            {producto.imagenes?.[0] ? (
              <img
                src={producto.imagenes[0]}
                alt={producto.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag size={18} className="text-[var(--text-faint)]" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--text-on-gold)] shadow-[var(--shadow-soft)]">
              <Check size={12} strokeWidth={3} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[14px] font-medium leading-snug text-[var(--text-primary)]">
              {producto.nombre}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[1px] text-[var(--gold)]">
              Listo en tu carrito
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href={carritoHref}
              onClick={onClose}
              className="catalog-gold-cta flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[12px] font-semibold uppercase tracking-[1.5px]"
            >
              Ver carrito
              <ArrowRight size={16} />
            </Link>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-card)] text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--text-secondary)] active:border-[var(--gold)] active:text-[var(--gold)]"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </MobileBottomSheet>
  )
}
