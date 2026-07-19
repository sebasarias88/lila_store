'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCarrito } from '@/lib/store'
import { cartSubtotal } from '@/lib/cart'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { useScrolledPast } from '@/lib/useScrolledPast'

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

type MobileFloatingCartProps = {
  catalogType?: CatalogType
  onOpenCart: () => void
}

export default function MobileFloatingCart({
  catalogType = 'detal',
  onOpenCart,
}: MobileFloatingCartProps) {
  const pathname = usePathname()
  const items = useCarrito(s => s.items)
  const cantidad = useCarrito(s => s.cantidad())
  const scrolled = useScrolledPast(100)

  const isCarritoPage =
    pathname === catalogPath(catalogType, '/carrito') ||
    pathname.startsWith(`${catalogPath(catalogType, '/carrito')}/`)

  const visible = scrolled && cantidad > 0 && !isCarritoPage
  const subtotal = cartSubtotal(items, catalogType)

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          onClick={onOpenCart}
          className="mobile-floating-cart fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[35] flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/95 px-4 py-3 shadow-[0_8px_32px_rgba(34,34,34,0.14)] backdrop-blur-md active:scale-[0.98] md:hidden"
          aria-label={`Carrito, ${cantidad} artículos, ${formatPrecio(subtotal)}`}
        >
          <span className="mobile-catalog-icon-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--gold-muted)] text-[var(--gold)]">
            <ShoppingBag size={20} strokeWidth={1.75} />
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[9px] font-bold text-[var(--text-on-gold)]">
              {cantidad > 99 ? '99+' : cantidad}
            </span>
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--text-subtle)]">
              Tu carrito
            </span>
            <span className="block truncate text-[15px] font-semibold text-[var(--gold)]">
              {formatPrecio(subtotal)}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--gold)]" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
