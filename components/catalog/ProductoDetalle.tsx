'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCarrito } from '@/lib/store'
import { Producto, ProductoSeccion, VariacionTipo } from '@/types'
import { getLineKey } from '@/lib/cart'
import { buildVariacionesSeleccionadas, imagenUrlVariacionActiva } from '@/lib/variaciones'
import {
  ShoppingBag,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  Check,
  Share2,
  ImageIcon,
  Package,
  Truck,
  CreditCard,
  X,
  Sparkles,
  Heart,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { toastProductoAgregado } from '@/lib/toastCatalog'
import {
  catalogPath,
  catalogCategoriaPath,
  getDescuentoPorcentaje,
  getProductoPrecios,
} from '@/lib/catalog'
import ProductoPrecio from '@/components/catalog/ProductoPrecio'
import PageGoldAccent from '@/components/catalog/PageGoldAccent'
import { CATALOG_STICKY_TOP_CLASS } from '@/lib/catalog-layout'
import MobileQuickAddSheet from '@/components/catalog/mobile/MobileQuickAddSheet'
import ProductVideoThumb from '@/components/catalog/ProductVideoThumb'
import ProductVideoModal from '@/components/catalog/ProductVideoModal'
import { productoTieneVideo } from '@/lib/video-url'
import {
  getStockCatalogo,
  mensajeStockRestante,
  productoComprableEnCatalogo,
  stockRestanteParaProducto,
} from '@/lib/stock'
import { PAGOS_COPY } from '@/lib/pagos-proximos'

const NUEVO_DIAS = 21

const ENVIO_INFO = [
  { icon: Package, text: 'Envío en Armenia el mismo día ✨' },
  { icon: Truck, text: 'Envíos a todo el país en 2–3 días 💕' },
  { icon: CreditCard, text: PAGOS_COPY.pdpLineaActivos },
  { icon: Sparkles, text: PAGOS_COPY.pdpLineaProximos },
] as const

function esNuevo(producto: Producto): boolean {
  if (!producto.created_at) return false
  const created = new Date(producto.created_at).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created < NUEVO_DIAS * 24 * 60 * 60 * 1000
}

function SeccionAcordeon({
  seccion,
  defaultOpen = false,
}: {
  seccion: ProductoSeccion
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span
          className={`text-[14px] font-bold transition-colors ${
            open
              ? 'text-[var(--accent-deep)]'
              : 'text-[var(--text-primary)] group-hover:text-[var(--accent-deep)]'
          }`}
        >
          {seccion.titulo}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            open
              ? 'bg-[var(--bg-muted)] text-[var(--accent-primary)]'
              : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]'
          }`}
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="whitespace-pre-line px-5 pb-5 text-[14px] font-medium leading-[1.75] text-[var(--text-secondary)]">
              {seccion.descripcion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProductoDetalle({
  producto,
  catalogType = 'detal',
  variaciones = [],
  secciones = [],
}: {
  producto: Producto
  catalogType?: 'detal' | 'mayoreo'
  variaciones?: VariacionTipo[]
  secciones?: ProductoSeccion[]
}) {
  const agregar = useCarrito(s => s.agregar)
  const items = useCarrito(s => s.items)

  const [imagenActiva, setImagenActiva] = useState(0)
  const [cantidad, setCantidad] = useState(1)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [agregado, setAgregado] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedVariaciones, setSelectedVariaciones] = useState<Record<string, string[]>>({})

  const tieneVariaciones = variaciones.length > 0
  const imagenVariacion = imagenUrlVariacionActiva(variaciones, selectedVariaciones)
  const imagenes = useMemo(() => {
    const base = producto.imagenes?.length ? producto.imagenes : []
    if (!imagenVariacion) return base
    return [imagenVariacion, ...base.filter(url => url !== imagenVariacion)]
  }, [producto.imagenes, imagenVariacion])

  useEffect(() => {
    setImagenActiva(0)
  }, [imagenVariacion])

  const tieneVideo = productoTieneVideo(producto)
  const totalSlides = imagenes.length + (tieneVideo ? 1 : 0)
  const videoSlideIndex = tieneVideo ? imagenes.length : -1
  const enSlideVideo = tieneVideo && imagenActiva === videoSlideIndex
  const posterVideo = imagenes[0] || null
  const comprable = productoComprableEnCatalogo(producto, catalogType)
  const stockCatalogo = getStockCatalogo(producto, catalogType)
  const stockRestante = stockRestanteParaProducto(producto, items, catalogType)
  const maxCantidadSeleccionable = Math.max(0, stockRestante)

  const toggleOpcion = (tipoId: string, opcionId: string) => {
    setSelectedVariaciones(prev => {
      const actuales = prev[tipoId] ?? []
      return {
        ...prev,
        [tipoId]: actuales.includes(opcionId)
          ? actuales.filter(id => id !== opcionId)
          : [...actuales, opcionId],
      }
    })
  }

  const variacionesParaCarrito = buildVariacionesSeleccionadas(
    variaciones,
    selectedVariaciones,
  )
  const lineKeyActual = getLineKey(producto.id, variacionesParaCarrito)

  const enCarrito = items.find(i => {
    const key = i.lineKey ?? getLineKey(i.producto.id, i.variacionesSeleccionadas)
    return key === lineKeyActual
  })

  const imagenAnterior = () => {
    if (totalSlides <= 1) return
    setImagenActiva(i => (i - 1 + totalSlides) % totalSlides)
  }

  const imagenSiguiente = () => {
    if (totalSlides <= 1) return
    setImagenActiva(i => (i + 1) % totalSlides)
  }

  const handleAgregar = () => {
    if (!comprable) return

    if (tieneVariaciones) {
      const faltantes = variaciones.filter(
        tipo => !(selectedVariaciones[tipo.id]?.length),
      )
      if (faltantes.length > 0) {
        toast.error('Elige tu opción favorita ✨')
        return
      }
    }

    if (stockRestante <= 0) {
      toast.error(mensajeStockRestante(0))
      return
    }

    const qty = Math.min(cantidad, stockRestante)
    const result = agregar(producto, variacionesParaCarrito, catalogType, qty)
    if (!result.ok) {
      toast.error(result.message)
      if (qty <= 0) return
    }

    setAgregado(true)
    setCantidad(1)
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches
    if (isMobile) {
      setQuickAddOpen(true)
    } else if (result.ok) {
      toastProductoAgregado(producto.nombre, '💕')
    }
    setTimeout(() => setAgregado(false), 2500)
  }

  const handleCompartir = async () => {
    try {
      await navigator.share({ title: producto.nombre, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado ✨')
    }
  }

  const precios = getProductoPrecios(producto, catalogType)
  const descuento =
    precios.precio != null
      ? getDescuentoPorcentaje(precios.precio, precios.precioAntes)
      : null

  const productosHref = catalogPath(catalogType, '/productos')
  const homeHref = catalogPath(catalogType, '/')
  const nuevo = esNuevo(producto)

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <PageGoldAccent />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[rgba(169,137,224,0.08)] to-transparent" />
      <div className="pointer-events-none absolute -left-10 top-40 h-48 w-48 rounded-full bg-[rgba(169,137,224,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-[28rem] h-56 w-56 rounded-full bg-[rgba(232,160,200,0.12)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href={productosHref}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]"
          >
            <ChevronLeft
              size={15}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Volver a explorar ✨
          </Link>

          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-[var(--text-muted)]"
          >
            <Link href={homeHref} className="transition-colors hover:text-[var(--accent-deep)]">
              Inicio
            </Link>
            <span className="text-[var(--border)]">/</span>
            <Link href={productosHref} className="transition-colors hover:text-[var(--accent-deep)]">
              Todo lo cute
            </Link>
            {producto.categoria && (
              <>
                <span className="text-[var(--border)]">/</span>
                <Link
                  href={catalogCategoriaPath(catalogType, producto.categoria.slug)}
                  className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 font-bold text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                >
                  {producto.categoria.nombre}
                </Link>
              </>
            )}
          </nav>
        </motion.div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Galería */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div
              className={`group relative aspect-[3/4] overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)] shadow-[var(--shadow-soft)] ${
                enSlideVideo ? 'cursor-pointer' : 'cursor-zoom-in'
              }`}
              onClick={() => {
                if (enSlideVideo) {
                  setVideoOpen(true)
                  return
                }
                if (imagenes.length) setZoomOpen(true)
              }}
            >
              {enSlideVideo && producto.video_url && producto.video_tipo ? (
                <ProductVideoThumb
                  posterUrl={posterVideo}
                  tipo={producto.video_tipo}
                  playSize="lg"
                  asButton={false}
                />
              ) : imagenes.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imagenActiva}
                    src={imagenes[imagenActiva]}
                    alt={producto.nombre}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon size={48} className="text-[var(--text-faint)]" />
                </div>
              )}

              {totalSlides > 1 && (
                <>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      imagenAnterior()
                    }}
                    className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:bg-[var(--accent-primary)] hover:text-white md:flex"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      imagenSiguiente()
                    }}
                    className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors hover:bg-[var(--accent-primary)] hover:text-white md:flex"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {!enSlideVideo && imagenes.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[var(--accent-deep)] opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <ZoomIn size={12} className="text-[var(--accent-primary)]" />
                  Ampliar ✨
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {!comprable && (
                  <span className="rounded-full bg-[var(--accent-deep)] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    Agotado
                  </span>
                )}
                {nuevo && comprable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-secondary)] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    <Sparkles size={11} />
                    Nuevo
                  </span>
                )}
                {descuento && comprable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-primary)] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    <Sparkles size={11} />
                    -{descuento}%
                  </span>
                )}
              </div>
            </div>

            {totalSlides > 1 && (
              <div className="flex gap-2.5 overflow-x-auto overscroll-x-contain pb-0.5 scrollbar-hide">
                {imagenes.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setImagenActiva(i)}
                    className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[16px] border-2 transition-all ${
                      imagenActiva === i
                        ? 'border-[var(--accent-primary)] opacity-100 shadow-[var(--shadow-soft)] ring-2 ring-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)]'
                        : 'border-transparent opacity-55 hover:opacity-90'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Vista ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
                {tieneVideo && producto.video_tipo ? (
                  <button
                    type="button"
                    onClick={() => setImagenActiva(videoSlideIndex)}
                    className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[16px] border-2 transition-all ${
                      enSlideVideo
                        ? 'border-[var(--accent-primary)] opacity-100 shadow-[var(--shadow-soft)] ring-2 ring-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)]'
                        : 'border-transparent opacity-55 hover:opacity-90'
                    }`}
                    aria-label="Video del producto"
                  >
                    <ProductVideoThumb
                      posterUrl={posterVideo}
                      tipo={producto.video_tipo}
                      playSize="sm"
                      asButton={false}
                    />
                  </button>
                ) : null}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className={`flex flex-col lg:sticky lg:self-start ${CATALOG_STICKY_TOP_CLASS}`}
          >
            {producto.categoria && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Link
                  href={catalogCategoriaPath(catalogType, producto.categoria.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                >
                  <Sparkles size={12} />
                  {producto.categoria.nombre}
                </Link>
              </div>
            )}

            <h1 className="text-[1.7rem] font-bold leading-tight text-[var(--text-primary)] sm:text-[2rem] lg:text-[2.15rem]">
              {producto.nombre}
            </h1>

            {producto.sku && (
              <p className="mt-2 text-[12px] font-medium text-[var(--text-subtle)]">
                SKU · {producto.sku}
              </p>
            )}

            <div className="mt-5">
              <ProductoPrecio
                producto={producto}
                catalogType={catalogType}
                disponible={producto.disponible}
                size="lg"
                layout="stack"
              />
            </div>

            {producto.descripcion && (
              <p className="mt-5 text-[15px] font-medium leading-[1.75] text-[var(--text-secondary)]">
                {producto.descripcion}
              </p>
            )}

            {tieneVariaciones && (
              <div className="mt-7 space-y-6">
                {variaciones.map(tipo => (
                  <div key={tipo.id}>
                    <p className="mb-3 text-[12px] font-bold text-[var(--accent-deep)]">
                      Elige {tipo.nombre.toLowerCase()} ✨
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {tipo.opciones?.map(opcion => {
                        const selected =
                          selectedVariaciones[tipo.id]?.includes(opcion.id) ?? false
                        const unavailable = !opcion.disponible

                        if (opcion.valor_color) {
                          return (
                            <button
                              key={opcion.id}
                              type="button"
                              title={opcion.nombre}
                              disabled={unavailable}
                              onClick={() => toggleOpcion(tipo.id, opcion.id)}
                              className={`rounded-full p-0.5 transition-all ${
                                unavailable
                                  ? 'cursor-not-allowed opacity-40'
                                  : 'cursor-pointer'
                              } ${
                                selected
                                  ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-base)]'
                                  : ''
                              }`}
                            >
                              <span
                                className="block h-9 w-9 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: opcion.valor_color }}
                              />
                            </button>
                          )
                        }

                        return (
                          <button
                            key={opcion.id}
                            type="button"
                            disabled={unavailable}
                            onClick={() => toggleOpcion(tipo.id, opcion.id)}
                            className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-bold transition-all duration-200 ${
                              unavailable
                                ? 'cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-faint)] line-through opacity-50'
                                : selected
                                  ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)] shadow-[var(--shadow-soft)]'
                                  : 'border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]'
                            }`}
                          >
                            {opcion.imagen_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={opcion.imagen_url}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : null}
                            {opcion.nombre}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="my-7 h-px bg-[var(--border)]" />

            {comprable ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[12px] font-bold text-[var(--text-muted)]">
                    Cantidad
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] p-1">
                    <button
                      type="button"
                      onClick={() => setCantidad(c => Math.max(1, c - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-white"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[2rem] text-center text-[15px] font-bold text-[var(--text-primary)]">
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCantidad(c => Math.min(maxCantidadSeleccionable, c + 1))
                      }
                      disabled={cantidad >= maxCantidadSeleccionable}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {enCarrito && (
                    <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[12px] font-bold text-[var(--accent-primary)]">
                      {enCarrito.cantidad} en tu carrito 💕
                    </span>
                  )}
                </div>
                {stockRestante <= 0 ? (
                  <p className="text-[12px] font-medium text-[var(--accent-deep)]">
                    {mensajeStockRestante(0)}
                  </p>
                ) : stockRestante < stockCatalogo ? (
                  <p className="text-[12px] font-medium text-[var(--text-muted)]">
                    {mensajeStockRestante(stockRestante)}
                  </p>
                ) : null}

                <motion.button
                  type="button"
                  onClick={handleAgregar}
                  disabled={stockRestante <= 0}
                  whileTap={stockRestante > 0 ? { scale: 0.98 } : undefined}
                  className={`flex w-full items-center justify-center gap-3 rounded-full py-4 text-[14px] font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                    agregado
                      ? 'bg-emerald-500 text-white'
                      : 'catalog-gold-cta'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {agregado ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={16} />
                        ¡Listo, en tu carrito! 💕
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        {stockRestante <= 0 ? 'Sin unidades disponibles' : 'Lo quiero ✨'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {enCarrito && (
                  <Link
                    href={catalogPath(catalogType, '/carrito')}
                    className="block w-full rounded-full py-3 text-center text-[13px] font-bold text-[var(--accent-deep)] transition-colors hover:text-[var(--accent-primary)]"
                  >
                    Ver mi carrito →
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[var(--border)] bg-gradient-to-br from-[#F9F6FF] to-[#F8EAF4] px-5 py-6 text-center shadow-[var(--shadow-soft)]">
                <Heart size={24} className="mx-auto fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
                <p className="mt-2 text-[15px] font-bold text-[var(--text-primary)]">
                  Uy, se agotó 💕
                </p>
                <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)]">
                  Pronto vuelve — mientras tanto mira más tesoros
                </p>
                <Link
                  href={productosHref}
                  className="catalog-gold-cta mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-bold"
                >
                  Ver más cute ✨
                </Link>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <ul className="space-y-2.5">
                {ENVIO_INFO.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                      <Icon size={14} strokeWidth={1.75} />
                    </span>
                    <span className="leading-snug">{text}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleCompartir}
                className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--accent-deep)] transition-colors hover:text-[var(--accent-primary)]"
              >
                <Share2 size={14} />
                Compartir este amor ✨
              </button>
            </div>
          </motion.div>
        </div>

        {secciones.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-16"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-1.5">
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
              <h2 className="text-[12px] font-bold text-[var(--accent-deep)]">
                Detallitos del producto 💕
              </h2>
            </div>
            <div className="w-full max-w-none space-y-3">
              {secciones.map((seccion, i) => (
                <SeccionAcordeon
                  key={seccion.id}
                  seccion={seccion}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      <AnimatePresence>
        {zoomOpen && imagenes.length > 0 && !enSlideVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(42,31,46,0.88)] p-6 backdrop-blur-md"
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
          >
            <motion.img
              src={imagenes[imagenActiva]}
              alt={producto.nombre}
              className="max-h-full max-w-full rounded-[24px] object-contain shadow-2xl"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--accent-deep)] shadow-sm transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {tieneVideo && producto.video_url && producto.video_tipo ? (
        <ProductVideoModal
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          url={producto.video_url}
          tipo={producto.video_tipo}
          titulo={producto.nombre}
        />
      ) : null}

      <MobileQuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        producto={producto}
        catalogType={catalogType}
      />
    </div>
  )
}
