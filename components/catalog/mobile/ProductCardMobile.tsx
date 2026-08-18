'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCarrito } from '@/lib/store'
import { Producto } from '@/types'
import {
  catalogPath,
  formatPrecio,
  getPrecioDetalInfo,
  getProductoPrecios,
  type CatalogType,
} from '@/lib/catalog'
import { categoriaTieneDescuentoActivo } from '@/lib/descuentos'
import { ShoppingBag, ImageIcon, Play } from 'lucide-react'
import MobileQuickAddSheet from '@/components/catalog/mobile/MobileQuickAddSheet'
import { productoTieneVideo } from '@/lib/video-url'
import { productoComprableEnCatalogo } from '@/lib/stock'
import toast from 'react-hot-toast'

const MAX_TITULO_CARD = 48

function tituloCard(producto: Producto): string {
  const nombre = producto.nombre.trim()
  if (nombre.length <= MAX_TITULO_CARD) return nombre

  const corte = nombre.slice(0, MAX_TITULO_CARD)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 16 ? corte.slice(0, ultimoEspacio) : corte.trimEnd()) + '…'
}

export default function ProductCardMobile({
  producto,
  catalogType = 'detal',
}: {
  producto: Producto
  catalogType?: 'detal' | 'mayoreo'
}) {
  const agregar = useCarrito(s => s.agregar)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const isMayoreo = catalogType === 'mayoreo'
  const { precio, precioAntes, consultar } = getProductoPrecios(producto, catalogType)
  const precioDetalInfo = isMayoreo ? getPrecioDetalInfo(producto) : null
  const productHref = catalogPath(catalogType, `/productos/${producto.slug}`)
  const descuentoCategoria = categoriaTieneDescuentoActivo(producto.categoria, catalogType)
  const pctDescuento =
    catalogType === 'mayoreo'
      ? producto.categoria?.descuento_porcentaje_mayoreo
      : producto.categoria?.descuento_porcentaje

  const comprable = productoComprableEnCatalogo(producto, catalogType)

  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!comprable) return
    const result = agregar(producto, undefined, catalogType)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setQuickAddOpen(true)
  }

  return (
    <>
      <motion.article
        layout
        className="mobile-product-card group flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]"
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        <div className="relative block aspect-[4/5] w-full shrink-0 overflow-hidden bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)]">
          <Link href={productHref} className="block h-full w-full">
            {producto.imagenes?.[0] ? (
              <img
                src={producto.imagenes[0]}
                alt={producto.nombre}
                className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon size={28} className="text-[var(--text-faint)]" />
              </div>
            )}
          </Link>

          {productoTieneVideo(producto) ? (
            <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[var(--accent-deep)] shadow-[var(--shadow-soft)]">
              <Play size={13} className="ml-0.5" fill="currentColor" />
            </span>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[rgba(34,34,34,0.4)] to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-1 p-2">
            {!comprable ? (
              <span className="rounded-full bg-[var(--accent-deep)] px-2.5 py-1 text-[10px] font-bold text-white">
                Agotado
              </span>
            ) : (
              <span />
            )}
            {descuentoCategoria && comprable && !consultar ? (
              <span className="rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-[10px] font-bold text-white">
                -{pctDescuento}%
              </span>
            ) : precioAntes && comprable && !consultar ? (
              <span className="rounded-full bg-[var(--accent-secondary)] px-2.5 py-1 text-[10px] font-bold text-white">
                Oferta
              </span>
            ) : null}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={handleAgregar}
            disabled={!comprable}
            className={`mobile-product-card-add absolute bottom-3 right-3 z-[1] ${
              comprable ? '' : 'mobile-product-card-add--disabled'
            }`}
            aria-label={comprable ? `Agregar ${producto.nombre}` : 'Agotado'}
          >
            <ShoppingBag size={18} strokeWidth={1.75} className="mobile-product-card-add__icon" aria-hidden />
          </motion.button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3 pb-3.5">
          <Link href={productHref} className="mb-2 block min-w-0">
            <p className="mb-1 line-clamp-1 text-[11px] font-bold text-[var(--accent-deep)]">
              {producto.categoria?.nombre || 'Producto'}
            </p>
            <h3
              className={`line-clamp-2 text-[13px] font-bold leading-[1.35] ${
                comprable ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }`}
              title={producto.nombre.trim()}
            >
              {tituloCard(producto)}
            </h3>
          </Link>

          <div className="mt-auto">
            {consultar ? (
              <span className="text-[13px] font-bold text-[var(--text-muted)]">Consultar precio</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-[15px] font-bold leading-none tracking-tight ${
                    comprable ? 'text-[var(--accent-deep)]' : 'text-[var(--text-faint)]'
                  }`}
                >
                  {formatPrecio(precio!)}
                </span>
                {precioAntes != null && precioAntes > 0 && (
                  <span className="text-[11px] font-medium text-[var(--text-muted)] line-through">
                    {formatPrecio(precioAntes)}
                  </span>
                )}
              </div>
            )}
            {precioDetalInfo != null && (
              <span className="mt-1 block text-[10px] font-medium leading-none text-[var(--text-muted)]">
                Detal{' '}
                <span className="font-bold text-[var(--text-secondary)]">
                  {formatPrecio(precioDetalInfo)}
                </span>
              </span>
            )}
          </div>
        </div>
      </motion.article>

      <MobileQuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        producto={producto}
        catalogType={catalogType}
      />
    </>
  )
}
