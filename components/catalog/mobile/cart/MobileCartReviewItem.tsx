'use client'

import { ShoppingBag } from 'lucide-react'
import { ItemCarrito } from '@/types'
import {
  formatVariacionesResumen,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { type CatalogType } from '@/lib/catalog'

const MAX_NOMBRE_RESUMEN = 46

function tituloResumen(nombre: string): string {
  const limpio = nombre.trim()
  if (limpio.length <= MAX_NOMBRE_RESUMEN) return limpio

  const corte = limpio.slice(0, MAX_NOMBRE_RESUMEN)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 14 ? corte.slice(0, ultimoEspacio) : corte.trimEnd()) + '…'
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

type MobileCartReviewItemProps = {
  item: ItemCarrito
  catalogType: CatalogType
}

export default function MobileCartReviewItem({ item, catalogType }: MobileCartReviewItemProps) {
  const { producto, cantidad, variacionesSeleccionadas } = item
  const vars = formatVariacionesResumen(variacionesSeleccionadas)
  const line = itemLineTotal(item, catalogType)
  const nombreCorto = tituloResumen(producto.nombre)
  const nombreCompleto = producto.nombre.trim()

  return (
    <article className="mobile-cart-review-item">
      <div className="mobile-cart-review-item__thumb">
        {producto.imagenes?.[0] ? (
          <img src={producto.imagenes[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-surface)]">
            <ShoppingBag size={16} className="text-[var(--text-faint)]" aria-hidden />
          </div>
        )}
      </div>

      <div className="mobile-cart-review-item__content min-w-0 flex-1">
        <div className="mobile-cart-review-item__top">
          <p
            className="mobile-cart-review-item__name truncate"
            title={nombreCompleto !== nombreCorto ? nombreCompleto : undefined}
          >
            {nombreCorto}
          </p>
          <p className="mobile-cart-review-item__price shrink-0 tabular-nums">
            {line != null ? formatPrecio(line) : 'Consultar'}
          </p>
        </div>

        <div className="mobile-cart-review-item__meta">
          <span className="mobile-cart-review-item__qty">
            {cantidad} {cantidad === 1 ? 'unidad' : 'unidades'}
          </span>
          {vars ? (
            <>
              <span className="mobile-cart-review-item__dot" aria-hidden />
              <span className={`mobile-cart-review-item__vars truncate ${variacionesCarritoClassName}`}>
                {vars}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { tituloResumen }
