'use client'

import { ItemCarrito } from '@/types'
import { itemLineKey } from '@/lib/cart'
import { type CatalogType } from '@/lib/catalog'
import MobileCartLineItem from '@/components/catalog/mobile/cart/MobileCartLineItem'

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

type MobileCartSummaryProps = {
  items: ItemCarrito[]
  subtotal: number
  catalogType: CatalogType
  envio?: number
  total?: number
  tiempoEntrega?: string
  envioGratis?: boolean
  showEnvio?: boolean
  compact?: boolean
  showProducts?: boolean
}

export default function MobileCartSummary({
  items,
  subtotal,
  catalogType,
  envio,
  total,
  tiempoEntrega,
  envioGratis = false,
  showEnvio = false,
  compact = false,
  showProducts = false,
}: MobileCartSummaryProps) {
  const listProducts = showProducts || !compact

  return (
    <div className="mobile-cart-summary">
      {listProducts && items.length > 0 ? (
        <div className="mobile-cart-summary__products">
          <p className="mobile-cart-summary__eyebrow">
            {items.length} producto{items.length !== 1 ? 's' : ''}
          </p>
          <div className={compact ? 'mobile-cart-summary__scroll max-h-44 overflow-y-auto overscroll-contain' : 'space-y-2'}>
            {items.map(item => (
              <MobileCartLineItem
                key={itemLineKey(item)}
                item={item}
                catalogType={catalogType}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mobile-cart-summary__totals">
        <p className="mobile-cart-summary__eyebrow">Resumen</p>

        <div className="mobile-cart-summary__row">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrecio(subtotal)}</span>
        </div>

        {showEnvio ? (
          <>
            <div className="mobile-cart-summary__row">
              <span>Envío</span>
              <span className="tabular-nums">
                {envioGratis ? 'Gratis' : envio === 0 ? 'A convenir' : formatPrecio(envio ?? 0)}
              </span>
            </div>
            {tiempoEntrega ? (
              <div className="mobile-cart-summary__row mobile-cart-summary__row--wrap">
                <span>Entrega</span>
                <span className="text-right">{tiempoEntrega}</span>
              </div>
            ) : null}
          </>
        ) : null}

        {total !== undefined ? (
          <div className="mobile-cart-summary__total">
            <span>Total</span>
            <span className="tabular-nums">{formatPrecio(total)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
