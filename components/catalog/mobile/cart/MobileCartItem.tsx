'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { ItemCarrito } from '@/types'
import {
  formatVariacionesResumen,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { catalogPath, getProductoPrecios, type CatalogType } from '@/lib/catalog'
import MobileCartQtyStepper from '@/components/catalog/mobile/cart/MobileCartQtyStepper'

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

type MobileCartItemProps = {
  item: ItemCarrito
  catalogType: CatalogType
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}

export default function MobileCartItem({
  item,
  catalogType,
  onDecrease,
  onIncrease,
  onRemove,
}: MobileCartItemProps) {
  const { producto, cantidad, variacionesSeleccionadas } = item
  const vars = formatVariacionesResumen(variacionesSeleccionadas)
  const line = itemLineTotal(item, catalogType)
  const productHref = catalogPath(catalogType, `/productos/${producto.slug}`)
  const { precio, consultar } = getProductoPrecios(producto, catalogType)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mobile-cart-item"
    >
      <div className="mobile-cart-item__row">
        <Link href={productHref} className="mobile-cart-item__thumb">
          {producto.imagenes?.[0] ? (
            <img
              src={producto.imagenes[0]}
              alt={producto.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--bg-surface)]">
              <ShoppingBag size={18} className="text-[var(--text-faint)]" />
            </div>
          )}
        </Link>

        <div className="mobile-cart-item__content min-w-0 flex-1">
          <div className="mobile-cart-item__head">
            <div className="min-w-0 flex-1">
              {producto.categoria ? (
                <p className="mobile-cart-item__category">{producto.categoria.nombre}</p>
              ) : null}
              <Link href={productHref}>
                <h3 className="mobile-cart-item__title line-clamp-2">{producto.nombre}</h3>
              </Link>
              {vars ? (
                <p className={`mobile-cart-item__vars line-clamp-1 ${variacionesCarritoClassName}`}>
                  {vars}
                </p>
              ) : null}
            </div>
            <p className="mobile-cart-item__price shrink-0 tabular-nums">
              {line != null ? formatPrecio(line) : 'Consultar'}
            </p>
          </div>

          <div className="mobile-cart-item__actions">
            <p className="mobile-cart-item__unit">
              {consultar || precio == null ? 'Consultar precio' : `${formatPrecio(precio)} c/u`}
            </p>
            <div className="mobile-cart-item__controls">
              <MobileCartQtyStepper
                value={cantidad}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
              />
              <button
                type="button"
                onClick={onRemove}
                className="mobile-cart-item__remove"
                aria-label="Eliminar producto"
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export { formatPrecio }
