'use client'

import { Producto } from '@/types'
import {
  CatalogType,
  formatPrecio,
  getDescuentoPorcentaje,
  getPrecioDetalInfo,
  getProductoPrecios,
} from '@/lib/catalog'
import { categoriaTieneDescuentoActivo } from '@/lib/descuentos'

type ProductoPrecioProps = {
  producto: Producto
  catalogType?: CatalogType
  disponible?: boolean
  size?: 'sm' | 'lg'
  layout?: 'inline' | 'stack'
}

export default function ProductoPrecio({
  producto,
  catalogType = 'detal',
  disponible = producto.disponible,
  size = 'sm',
  layout = 'inline',
}: ProductoPrecioProps) {
  const { precio, precioAntes, consultar } = getProductoPrecios(producto, catalogType)
  const isMayoreo = catalogType === 'mayoreo'
  const precioDetalInfo = isMayoreo ? getPrecioDetalInfo(producto) : null
  const precioClass =
    size === 'lg'
      ? 'text-[1.85rem] font-bold leading-none sm:text-[2.1rem]'
      : 'text-base font-bold leading-none'
  const labelClass = 'text-[11px] font-bold text-[var(--text-subtle)]'

  const priceColor = disponible
    ? 'text-[var(--accent-deep)]'
    : 'text-[var(--text-faint)]'

  const wrapperClass =
    layout === 'stack'
      ? 'flex flex-col gap-1.5'
      : 'flex flex-wrap items-baseline gap-x-2 gap-y-1'

  const detalInfoNode =
    precioDetalInfo != null ? (
      <span className="mt-2.5 inline-flex w-fit items-baseline gap-2 rounded-full bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] leading-none">
        <span className="font-bold text-[var(--text-subtle)]">Precio al detal</span>
        <span className="font-bold text-[var(--text-secondary)]">
          {formatPrecio(precioDetalInfo)}
        </span>
      </span>
    ) : null

  if (consultar) {
    return (
      <div className={wrapperClass}>
        {isMayoreo && <span className={labelClass}>Precio mayorista</span>}
        <span className={`${precioClass} text-[var(--text-subtle)]`}>Consultar precio</span>
        {detalInfoNode}
      </div>
    )
  }

  const descuento =
    precio != null ? getDescuentoPorcentaje(precio, precioAntes) : null
  const descuentoCategoria = categoriaTieneDescuentoActivo(producto.categoria, catalogType)
  const pctDescuento =
    catalogType === 'mayoreo'
      ? producto.categoria?.descuento_porcentaje_mayoreo
      : producto.categoria?.descuento_porcentaje

  return (
    <div className={wrapperClass}>
      {isMayoreo && <span className={labelClass}>Precio mayorista</span>}
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className={`${precioClass} ${priceColor}`}>{formatPrecio(precio!)}</span>
        {precioAntes != null && precioAntes > 0 && (
          <span className="shrink-0 text-sm font-medium leading-none text-[var(--text-muted)] line-through sm:text-base">
            {formatPrecio(precioAntes)}
          </span>
        )}
      </div>
      {descuentoCategoria && pctDescuento != null && size === 'lg' && (
        <span className="inline-flex w-fit rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-primary)]">
          -{pctDescuento}% en {producto.categoria?.nombre}
        </span>
      )}
      {descuento != null && size === 'lg' && disponible && (
        <span className="text-[12px] font-medium text-[var(--text-muted)]">
          Ahorras {formatPrecio(precioAntes! - precio!)}
        </span>
      )}
      {detalInfoNode}
    </div>
  )
}
