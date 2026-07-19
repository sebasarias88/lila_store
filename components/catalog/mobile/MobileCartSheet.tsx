'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCarrito } from '@/lib/store'
import {
  cartSubtotal,
  itemLineKey,
} from '@/lib/cart'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { ShoppingBag } from 'lucide-react'
import LuxuryCartIcon from '@/components/catalog/LuxuryCartIcon'
import MobileBottomSheet from '@/components/catalog/mobile/MobileBottomSheet'
import MobileCartItem from '@/components/catalog/mobile/cart/MobileCartItem'
import { formatPrecio } from '@/components/catalog/mobile/cart/MobileCartItem'

type MobileCartSheetProps = {
  open: boolean
  onClose: () => void
  catalogType?: CatalogType
}

export default function MobileCartSheet({
  open,
  onClose,
  catalogType = 'detal',
}: MobileCartSheetProps) {
  const { items, quitar, actualizarCantidad } = useCarrito()
  const carritoHref = catalogPath(catalogType, '/carrito')
  const subtotal = cartSubtotal(items, catalogType)

  const headerContent = (
    <div className="flex min-w-0 items-center gap-3">
      <LuxuryCartIcon size={18} />
      <div className="min-w-0">
        <h2 className="text-[13px] font-light uppercase tracking-[3px] text-[var(--text-primary)]">
          Carrito
        </h2>
        {items.length > 0 ? (
          <p className="mt-1 text-[11px] font-light text-[var(--text-muted)]">
            {items.length} artículo{items.length !== 1 ? 's' : ''}
          </p>
        ) : null}
      </div>
    </div>
  )

  const footer =
    items.length > 0 ? (
      <div className="mobile-cart-sheet-footer">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-light uppercase tracking-[1.5px] text-[var(--text-muted)]">
            Subtotal
          </span>
          <span className="text-[16px] font-light tabular-nums text-[var(--gold)]">
            {formatPrecio(subtotal)}
          </span>
        </div>
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link
            href={carritoHref}
            onClick={onClose}
            className="catalog-gold-cta flex min-h-[50px] w-full items-center justify-center rounded-xl text-[11px] font-medium uppercase tracking-[2.5px]"
          >
            Finalizar pedido
          </Link>
        </motion.div>
      </div>
    ) : undefined

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title="Carrito"
      headerContent={headerContent}
      height={items.length > 2 ? 'tall' : 'auto'}
      footer={footer}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 pb-6 text-center">
          <ShoppingBag size={36} className="mb-4 text-[var(--text-faint)]" strokeWidth={1.25} />
          <p className="text-[13px] font-light uppercase tracking-[1px] text-[var(--text-muted)]">
            Tu carrito está vacío
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-xl border border-[var(--border)] px-5 py-2.5 text-[10px] font-light uppercase tracking-[2px] text-[var(--gold)] active:bg-[var(--gold-muted)]"
          >
            Ver catálogo
          </button>
        </div>
      ) : (
        <div className="mobile-cart-item-list mobile-cart-sheet-list px-4 pb-2 pt-1">
          <AnimatePresence initial={false}>
            {items.map(item => {
              const key = itemLineKey(item)
              return (
                <MobileCartItem
                  key={key}
                  item={item}
                  catalogType={catalogType}
                  onDecrease={() => actualizarCantidad(key, item.cantidad - 1)}
                  onIncrease={() => actualizarCantidad(key, item.cantidad + 1)}
                  onRemove={() => quitar(key)}
                />
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </MobileBottomSheet>
  )
}
