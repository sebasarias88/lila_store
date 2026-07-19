'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { ItemCarrito } from '@/types'
import {
  formatVariacionesResumen,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { catalogPath, type CatalogType } from '@/lib/catalog'

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

type MobileCartLineItemProps = {
  item: ItemCarrito
  catalogType: CatalogType
  linkable?: boolean
  compact?: boolean
}

export default function MobileCartLineItem({
  item,
  catalogType,
  linkable = false,
  compact = false,
}: MobileCartLineItemProps) {
  const { producto, cantidad, variacionesSeleccionadas } = item
  const vars = formatVariacionesResumen(variacionesSeleccionadas)
  const line = itemLineTotal(item, catalogType)
  const productHref = catalogPath(catalogType, `/productos/${producto.slug}`)

  const image = (
    <div
      className={`mobile-cart-line-thumb shrink-0 overflow-hidden ${
        compact ? 'mobile-cart-line-thumb--compact' : ''
      }`}
    >
      {producto.imagenes?.[0] ? (
        <img
          src={producto.imagenes[0]}
          alt={producto.nombre}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-surface)]">
          <ShoppingBag size={16} className="text-[var(--text-faint)]" />
        </div>
      )}
    </div>
  )

  return (
    <div className={`mobile-cart-line-item ${compact ? 'mobile-cart-line-item--compact' : ''}`}>
      {linkable ? <Link href={productHref}>{image}</Link> : image}

      <div className="min-w-0 flex-1">
        {producto.categoria && !compact ? (
          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-[var(--accent-deep)]">
            {producto.categoria.nombre}
          </p>
        ) : null}

        {linkable ? (
          <Link href={productHref}>
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text-primary)]">
              {producto.nombre}
            </p>
          </Link>
        ) : (
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text-primary)]">
            {producto.nombre}
          </p>
        )}

        {vars ? (
          <p className={`mt-0.5 line-clamp-1 ${variacionesCarritoClassName}`}>{vars}</p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="mobile-cart-line-qty">× {cantidad}</span>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--accent-deep)]">
            {line != null ? formatPrecio(line) : 'Consultar'}
          </p>
        </div>
      </div>
    </div>
  )
}
