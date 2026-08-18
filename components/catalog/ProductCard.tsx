'use client'

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
import { ShoppingBag, ImageIcon, Heart, Sparkles, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { productoTieneVideo } from '@/lib/video-url'
import { productoComprableEnCatalogo } from '@/lib/stock'

const MAX_TITULO_CARD = 52
const NUEVO_DIAS = 21

function tituloCard(producto: Producto): string {
  const nombre = producto.nombre.trim()
  if (nombre.length <= MAX_TITULO_CARD) return nombre

  const segmento = nombre.split(/\s+(?:que|con|para|en)\s+|(?<=[.,;:])\s+/i)[0]?.trim()
  if (segmento && segmento.length >= 6 && segmento.length <= MAX_TITULO_CARD) {
    return segmento
  }

  const corte = nombre.slice(0, MAX_TITULO_CARD)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 20 ? corte.slice(0, ultimoEspacio) : corte.trimEnd()) + '…'
}

function esNuevo(producto: Producto): boolean {
  if (!producto.created_at) return false
  const created = new Date(producto.created_at).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created < NUEVO_DIAS * 24 * 60 * 60 * 1000
}

export default function ProductCard({
  producto,
  catalogType = 'detal',
}: {
  producto: Producto
  catalogType?: 'detal' | 'mayoreo'
}) {
  const agregar = useCarrito(s => s.agregar)
  const isMayoreo = catalogType === 'mayoreo'
  const { precio, precioAntes, consultar } = getProductoPrecios(producto, catalogType)
  const precioDetalInfo = isMayoreo ? getPrecioDetalInfo(producto) : null
  const productHref = catalogPath(catalogType, `/productos/${producto.slug}`)
  const descuentoCategoria = categoriaTieneDescuentoActivo(producto.categoria, catalogType)
  const pctDescuento =
    catalogType === 'mayoreo'
      ? producto.categoria?.descuento_porcentaje_mayoreo
      : producto.categoria?.descuento_porcentaje
  const nuevo = esNuevo(producto)
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
    toast.success(`${producto.nombre} al carrito ✨`)
  }

  return (
    <Link href={productHref} className="block h-full">
      <div className="catalog-product-card group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--accent-primary)_50%,var(--border))] hover:shadow-[var(--shadow-card-hover)]">
        <div className="relative aspect-[3/4] w-full flex-shrink-0 overflow-hidden bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)]">
          {producto.imagenes?.[0] ? (
            <img
              src={producto.imagenes[0]}
              alt={producto.nombre}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon size={28} className="text-[var(--text-faint)]" />
            </div>
          )}

          {productoTieneVideo(producto) ? (
            <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[var(--accent-deep)] shadow-[var(--shadow-soft)]">
              <Play size={14} className="ml-0.5" fill="currentColor" />
            </span>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(110,79,168,0.2)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {!comprable && (
                <span className="shrink-0 rounded-full bg-[var(--accent-deep)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  Agotado
                </span>
              )}
              {nuevo && comprable && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-secondary)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Sparkles size={10} />
                  Nuevo
                </span>
              )}
              {descuentoCategoria && comprable && !consultar && (
                <span className="shrink-0 rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  -{pctDescuento}%
                </span>
              )}
              {!descuentoCategoria && precioAntes && comprable && !consultar && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Sparkles size={10} />
                  Oferta
                </span>
              )}
            </div>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--accent-primary)] shadow-sm backdrop-blur-sm transition-colors group-hover:bg-[var(--accent-primary)] group-hover:text-white"
              aria-hidden
            >
              <Heart size={13} className="group-hover:fill-current" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 py-4 min-h-[8.25rem]">
          <div className="mb-1.5 flex items-center gap-1.5">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--accent-deep)]">
              {producto.categoria?.nombre || 'Producto'}
            </p>
          </div>

          <h3
            className={`line-clamp-2 text-[14px] font-bold leading-snug ${
              comprable ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
            }`}
            title={producto.nombre.trim()}
          >
            {tituloCard(producto)}
          </h3>

          <div className="mt-auto pt-3">
            {isMayoreo && (
              <span className="mb-1.5 inline-flex rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-deep)]">
                Mayorista
              </span>
            )}
            {consultar ? (
              <span className="text-[15px] font-bold text-[var(--text-muted)]">
                Consultar precio
              </span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-[17px] font-bold leading-none ${
                    comprable ? 'text-[var(--accent-deep)]' : 'text-[var(--text-faint)]'
                  }`}
                >
                  {formatPrecio(precio!)}
                </span>
                {precioAntes != null && precioAntes > 0 && (
                  <span className="shrink-0 text-[12px] font-medium leading-none text-[var(--text-muted)] line-through">
                    {formatPrecio(precioAntes)}
                  </span>
                )}
              </div>
            )}
            {precioDetalInfo != null && (
              <span className="mt-1.5 block text-[11px] font-medium text-[var(--text-muted)]">
                Precio al detal{' '}
                <span className="font-bold text-[var(--text-secondary)]">
                  {formatPrecio(precioDetalInfo)}
                </span>
              </span>
            )}

            <motion.button
              type="button"
              onClick={handleAgregar}
              whileTap={{ scale: 0.98 }}
              className="catalog-gold-cta mt-3.5 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!comprable}
            >
              {comprable ? (
                <>
                  <ShoppingBag size={14} />
                  Lo quiero ✨
                </>
              ) : (
                <>
                  <Heart size={14} />
                  Agotado 💕
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </Link>
  )
}
