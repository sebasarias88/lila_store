'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useCarrito } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { DatosCliente, ItemCarrito } from '@/types'
import { generarMensajeWhatsApp, abrirWhatsApp } from '@/lib/whatsapp'
import {
  cartSubtotal,
  formatVariacionesResumen,
  itemLineKey,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { parseCopValue } from '@/lib/currency'
import { catalogPath, MAYOREO_MIN_COMPRA, type CatalogType } from '@/lib/catalog'
import CarritoMobile from '@/components/catalog/mobile/cart/CarritoMobile'
import PageGoldAccent from '@/components/catalog/PageGoldAccent'
import StickySidebar from '@/components/catalog/StickySidebar'
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  MapPin,
  User,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Truck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

function WhatsAppIcon({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

type Config = {
  whatsapp_numero: string
  envio_armenia: string
  envio_nacional: string
  envio_gratis_desde: string
  tiempo_entrega_armenia: string
  tiempo_entrega_nacional: string
  metodos_pago: string[]
}

type Step = 'carrito' | 'datos' | 'resumen'

const CIUDADES_ARMENIA = ['armenia', 'armenia quindío', 'armenia quindio']

const STEPS: { id: Step; label: string }[] = [
  { id: 'carrito', label: 'Carrito' },
  { id: 'datos', label: 'Tus datos' },
  { id: 'resumen', label: 'Confirmar' },
]

function SectionTitle({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
        <Icon size={15} />
      </span>
      <h2 className="text-[14px] font-bold text-[var(--accent-deep)]">{children}</h2>
    </div>
  )
}

function CartSidebar({
  children,
  className = '',
  top = 96,
}: {
  children: React.ReactNode
  className?: string
  top?: number
}) {
  return (
    <StickySidebar className={className} top={top}>
      <aside className="w-full">{children}</aside>
    </StickySidebar>
  )
}

function OrderSummaryPanel({
  items,
  subtotal,
  catalogType,
  envio,
  total,
  tiempoEntrega,
  envioGratis,
  showEnvio = false,
}: {
  items: ItemCarrito[]
  subtotal: number
  catalogType: CatalogType
  envio?: number
  total?: number
  tiempoEntrega?: string
  envioGratis?: boolean
  showEnvio?: boolean
}) {
  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]">
      <p className="text-[13px] font-bold text-[var(--accent-deep)]">Resumen</p>

      <div className="space-y-3 border-b border-[var(--border)] pb-4">
        {items.map(item => {
          const key = itemLineKey(item)
          const { producto, cantidad, variacionesSeleccionadas } = item
          const vars = formatVariacionesResumen(variacionesSeleccionadas)

          return (
            <div key={key} className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-[var(--bg-muted)]">
                {producto.imagenes?.[0] ? (
                  <img
                    src={producto.imagenes[0]}
                    alt={producto.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag size={14} className="text-[var(--text-faint)]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-[var(--text-primary)]">
                  {producto.nombre}
                </p>
                {vars && <p className={`truncate ${variacionesCarritoClassName}`}>{vars}</p>}
                <p className="text-[11px] font-medium text-[var(--text-subtle)]">× {cantidad}</p>
              </div>
              <p className="shrink-0 text-[12px] font-bold text-[var(--accent-deep)]">
                {(() => {
                  const line = itemLineTotal(item, catalogType)
                  return line != null ? formatPrecio(line) : 'Consultar'
                })()}
              </p>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[13px] font-medium">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="font-bold text-[var(--text-primary)]">{formatPrecio(subtotal)}</span>
        </div>
        {showEnvio && (
          <>
            <div className="flex justify-between text-[13px] font-medium">
              <span className="text-[var(--text-muted)]">Envío</span>
              <span className="font-bold text-[var(--text-primary)]">
                {envioGratis ? 'Gratis' : envio === 0 ? 'A convenir' : formatPrecio(envio ?? 0)}
              </span>
            </div>
            {tiempoEntrega && (
              <div className="flex justify-between text-[13px] font-medium">
                <span className="text-[var(--text-muted)]">Entrega</span>
                <span className="font-bold text-[var(--text-primary)]">{tiempoEntrega}</span>
              </div>
            )}
          </>
        )}
        {total !== undefined && (
          <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3">
            <span className="text-[12px] font-bold text-[var(--text-secondary)]">Total</span>
            <span className="text-xl font-bold text-[var(--accent-deep)]">{formatPrecio(total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CarritoPage() {
  const pathname = usePathname()
  const catalogType: CatalogType =
    pathname.startsWith('/mayorista') || pathname.startsWith('/mayoreo')
      ? 'mayoreo'
      : 'detal'
  const productosHref = catalogPath(catalogType, '/productos')

  const { items, quitar, actualizarCantidad, vaciar } = useCarrito()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>('carrito')
  const [config, setConfig] = useState<Config>({
    whatsapp_numero: '573185867702',
    envio_armenia: '5000',
    envio_nacional: '0',
    envio_gratis_desde: '0',
    tiempo_entrega_armenia: 'El mismo día',
    tiempo_entrega_nacional: '2 a 3 días hábiles',
    metodos_pago: ['Efectivo contra entrega', 'Nequi', 'Daviplata', 'Transferencia bancaria'],
  })
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const [datos, setDatos] = useState<DatosCliente>({
    nombre: '',
    celular: '',
    direccion: '',
    ciudad: '',
    metodoPago: '',
    notas: '',
  })

  const [errores, setErrores] = useState<Partial<DatosCliente>>({})

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.from('configuracion').select('clave, valor')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((r: { clave: string; valor: string }) => {
        map[r.clave] = r.valor
      })
      setConfig({
        whatsapp_numero: map['whatsapp_numero'] || '573185867702',
        envio_armenia: map['envio_armenia'] || '5000',
        envio_nacional: map['envio_nacional'] || '0',
        envio_gratis_desde: map['envio_gratis_desde'] || '0',
        tiempo_entrega_armenia: map['tiempo_entrega_armenia'] || 'El mismo día',
        tiempo_entrega_nacional: map['tiempo_entrega_nacional'] || '2 a 3 días hábiles',
        metodos_pago: (() => {
          const key =
            catalogType === 'mayoreo' ? 'metodos_pago_mayoreo' : 'metodos_pago_detal'
          const raw = map[key] ?? map['metodos_pago']
          try {
            const parsed = JSON.parse(raw || '[]')
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })(),
      })
    }
    setLoadingConfig(false)
  }, [catalogType])

  useEffect(() => {
    setMounted(true)
    void fetchConfig()
  }, [fetchConfig])

  const esArmenia = CIUDADES_ARMENIA.includes(datos.ciudad.toLowerCase().trim())
  const subtotal = useMemo(
    () => cartSubtotal(items, catalogType),
    [items, catalogType],
  )
  const envioGratisDesde = parseCopValue(config.envio_gratis_desde)
  const envioGratis = envioGratisDesde > 0 && subtotal >= envioGratisDesde

  const costoEnvio = envioGratis
    ? 0
    : esArmenia
      ? parseCopValue(config.envio_armenia)
      : parseCopValue(config.envio_nacional)

  const tiempoEntrega = esArmenia ? config.tiempo_entrega_armenia : config.tiempo_entrega_nacional

  const totalFinal = subtotal + costoEnvio
  const stepIndex = STEPS.findIndex(s => s.id === step)
  const stickyTop = catalogType === 'mayoreo' ? 100 : 96

  const minimoMayoreo = catalogType === 'mayoreo' ? MAYOREO_MIN_COMPRA : 0
  const cumpleMinimo = subtotal >= minimoMayoreo
  const faltaParaMinimo = Math.max(0, minimoMayoreo - subtotal)

  const validar = () => {
    const e: Partial<DatosCliente> = {}
    if (!datos.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!datos.celular.trim()) e.celular = 'El celular es requerido'
    else if (!/^[0-9+\s]{7,15}$/.test(datos.celular.trim())) e.celular = 'Número inválido'
    if (!datos.direccion.trim()) e.direccion = 'La dirección es requerida'
    if (!datos.ciudad.trim()) e.ciudad = 'La ciudad es requerida'
    if (!datos.metodoPago) e.metodoPago = 'Selecciona un método de pago'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleContinuar = () => {
    if (items.length === 0) {
      toast.error('Tu carrito está vacío')
      return
    }
    if (catalogType === 'mayoreo' && !cumpleMinimo) {
      toast.error(
        `La compra mínima mayorista es ${formatPrecio(minimoMayoreo)}`,
      )
      return
    }
    setStep('datos')
    scrollTop()
  }

  const handleConfirmar = () => {
    if (!validar()) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    setStep('resumen')
    scrollTop()
  }

  const handleEnviarWhatsApp = () => {
    setEnviando(true)
    const mensaje = generarMensajeWhatsApp(
      items,
      datos,
      costoEnvio,
      tiempoEntrega,
      catalogType,
    )
    setTimeout(() => {
      abrirWhatsApp(mensaje, config.whatsapp_numero)
      vaciar()
      setEnviando(false)
      toast.success('¡Pedido enviado! Revisa tu WhatsApp')
    }, 800)
  }

  const inputClass = (campo: keyof DatosCliente) =>
    `w-full rounded-full border bg-[var(--bg-muted)] px-4 py-3 text-[14px] font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-faint)] ${
      errores[campo]
        ? 'border-red-300 focus:border-red-400'
        : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:bg-white'
    }`

  if (!mounted) return null

  const mobilePaddingTop = 'max-md:pt-[6.5rem]'

  return (
    <>
      <PageGoldAccent />

      {/* ── Mobile checkout ── */}
      <div className={`relative min-h-screen md:hidden ${mobilePaddingTop}`}>
        <CarritoMobile
          catalogType={catalogType}
          productosHref={productosHref}
          step={step}
          setStep={setStep}
          stepIndex={stepIndex}
          items={items}
          quitar={key => {
            quitar(key)
            toast.success('Producto eliminado')
          }}
          actualizarCantidad={actualizarCantidad}
          subtotal={subtotal}
          minimoMayoreo={minimoMayoreo}
          cumpleMinimo={cumpleMinimo}
          faltaParaMinimo={faltaParaMinimo}
          datos={datos}
          setDatos={setDatos}
          errores={errores}
          setErrores={setErrores}
          config={config}
          loadingConfig={loadingConfig}
          enviando={enviando}
          costoEnvio={costoEnvio}
          envioGratis={envioGratis}
          tiempoEntrega={tiempoEntrega}
          totalFinal={totalFinal}
          handleContinuar={handleContinuar}
          handleConfirmar={handleConfirmar}
          handleEnviarWhatsApp={handleEnviarWhatsApp}
          inputClass={inputClass}
        />
      </div>

      {/* ── Desktop ── */}
      <div className="relative hidden min-h-screen pb-16 pt-28 sm:pt-32 md:block">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">
              Mi pedido
            </span>
          </div>
          <h1 className="text-[1.85rem] font-bold leading-none text-[var(--text-primary)] sm:text-[2.15rem]">
            Tu carrito
          </h1>

          {/* Steps */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (i < stepIndex) setStep(s.id)
                  }}
                  disabled={i > stepIndex}
                  className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                    step === s.id
                      ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                      : i < stepIndex
                        ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]'
                        : 'cursor-default text-[var(--text-faint)]'
                  }`}
                >
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] tabular-nums shadow-sm">
                    {i + 1}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-[var(--text-subtle)]" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: CARRITO */}
          {step === 'carrito' && (
            <motion.div
              key="carrito"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14"
            >
              <div className="min-w-0">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] py-16 text-center shadow-[var(--shadow-soft)]">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                      <ShoppingBag size={28} />
                    </span>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">
                      Tu carrito está vacío
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-[var(--text-muted)]">
                      Agrega algo cute y vuelve aquí ✨
                    </p>
                    <Link
                      href={productosHref}
                      className="catalog-gold-cta mt-6 rounded-full px-5 py-2.5 text-[13px] font-bold"
                    >
                      Ver catálogo
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map(item => {
                        const key = itemLineKey(item)
                        const { producto, cantidad, variacionesSeleccionadas } = item
                        const vars = formatVariacionesResumen(variacionesSeleccionadas)

                        return (
                          <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]"
                          >
                            <Link
                              href={catalogPath(catalogType, `/productos/${producto.slug}`)}
                              className="h-24 w-20 shrink-0 overflow-hidden rounded-[16px] bg-gradient-to-b from-[#FDEBF4] to-[var(--bg-muted)] sm:h-28 sm:w-24"
                            >
                              {producto.imagenes?.[0] ? (
                                <img
                                  src={producto.imagenes[0]}
                                  alt={producto.nombre}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ShoppingBag size={18} className="text-[var(--text-faint)]" />
                                </div>
                              )}
                            </Link>

                            <div className="min-w-0 flex-1">
                              {producto.categoria && (
                                <p className="mb-1 text-[11px] font-bold text-[var(--accent-deep)]">
                                  {producto.categoria.nombre}
                                </p>
                              )}
                              <Link
                                href={catalogPath(catalogType, `/productos/${producto.slug}`)}
                                className="mb-1 block truncate text-[15px] font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-deep)]"
                              >
                                {producto.nombre}
                              </Link>
                              {vars && (
                                <p className={`mb-2 ${variacionesCarritoClassName}`}>{vars}</p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => actualizarCantidad(key, cantidad - 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-white"
                                    aria-label="Disminuir cantidad"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="min-w-[1.5rem] text-center text-[14px] font-bold text-[var(--text-primary)]">
                                    {cantidad}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => actualizarCantidad(key, cantidad + 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-white"
                                    aria-label="Aumentar cantidad"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[16px] font-bold text-[var(--accent-deep)]">
                                    {(() => {
                                      const line = itemLineTotal(item, catalogType)
                                      return line != null ? formatPrecio(line) : 'Consultar'
                                    })()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      quitar(key)
                                      toast.success('Producto eliminado')
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-muted)] hover:text-red-400"
                                    aria-label="Eliminar producto"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-6">
                  <OrderSummaryPanel
                    items={items}
                    subtotal={subtotal}
                    catalogType={catalogType}
                  />
                  {catalogType === 'mayoreo' && !cumpleMinimo && (
                    <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border))] bg-[var(--bg-muted)] p-4">
                      <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                        Compra mínima mayorista
                      </p>
                      <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[var(--text-secondary)]">
                        El pedido mínimo es {formatPrecio(minimoMayoreo)}. Te faltan{' '}
                        <span className="font-bold text-[var(--accent-primary)]">
                          {formatPrecio(faltaParaMinimo)}
                        </span>{' '}
                        para continuar.
                      </p>
                    </div>
                  )}
                  <p className="text-[12px] font-medium text-[var(--text-subtle)]">
                    El envío se calcula en el siguiente paso según tu ciudad.
                  </p>
                  <motion.button
                    type="button"
                    whileTap={catalogType === 'mayoreo' && !cumpleMinimo ? undefined : { scale: 0.98 }}
                    onClick={handleContinuar}
                    disabled={catalogType === 'mayoreo' && !cumpleMinimo}
                    className={`catalog-gold-cta flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold ${
                      catalogType === 'mayoreo' && !cumpleMinimo
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                  >
                    Continuar
                    <ChevronRight size={14} />
                  </motion.button>
                  <Link
                    href={productosHref}
                    className="block text-center text-[13px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-deep)]"
                  >
                    ← Seguir comprando
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: DATOS */}
          {step === 'datos' && (
            <motion.div
              key="datos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14"
            >
              <div className="min-w-0 space-y-8">
                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={User}>Datos personales</SectionTitle>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[12px] font-bold text-[var(--text-muted)]">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={datos.nombre}
                        onChange={e => {
                          setDatos(d => ({ ...d, nombre: e.target.value }))
                          if (errores.nombre) setErrores(er => ({ ...er, nombre: '' }))
                        }}
                        placeholder="Ej: María López"
                        className={inputClass('nombre')}
                      />
                      {errores.nombre && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-400">{errores.nombre}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] font-bold text-[var(--text-muted)]">
                        Celular *
                      </label>
                      <input
                        type="tel"
                        value={datos.celular}
                        onChange={e => {
                          setDatos(d => ({ ...d, celular: e.target.value }))
                          if (errores.celular) setErrores(er => ({ ...er, celular: '' }))
                        }}
                        placeholder="Ej: 3001234567"
                        className={inputClass('celular')}
                      />
                      {errores.celular && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-400">{errores.celular}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={MapPin}>Dirección de entrega</SectionTitle>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[12px] font-bold text-[var(--text-muted)]">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={datos.ciudad}
                        onChange={e => {
                          setDatos(d => ({ ...d, ciudad: e.target.value }))
                          if (errores.ciudad) setErrores(er => ({ ...er, ciudad: '' }))
                        }}
                        placeholder="Ej: Armenia, Bogotá, Medellín..."
                        className={inputClass('ciudad')}
                      />
                      {errores.ciudad && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-400">{errores.ciudad}</p>
                      )}
                      {datos.ciudad.trim() && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2.5 flex items-start gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-2 text-[12px] font-medium text-[var(--accent-deep)]"
                        >
                          <Truck size={13} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
                          {envioGratis
                            ? 'Envío gratis para tu pedido'
                            : costoEnvio === 0
                              ? 'Envío a convenir con el negocio'
                              : `Envío estimado: ${formatPrecio(costoEnvio)} — ${tiempoEntrega}`}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] font-bold text-[var(--text-muted)]">
                        Dirección completa *
                      </label>
                      <input
                        type="text"
                        value={datos.direccion}
                        onChange={e => {
                          setDatos(d => ({ ...d, direccion: e.target.value }))
                          if (errores.direccion) setErrores(er => ({ ...er, direccion: '' }))
                        }}
                        placeholder="Ej: Calle 10 #5-20, Barrio Los Andes"
                        className={inputClass('direccion')}
                      />
                      {errores.direccion && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-400">{errores.direccion}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={CreditCard}>Método de pago</SectionTitle>
                  {loadingConfig ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 animate-pulse rounded-full bg-[var(--bg-muted)]" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {config.metodos_pago.map(metodo => (
                        <button
                          key={metodo}
                          type="button"
                          onClick={() => {
                            setDatos(d => ({ ...d, metodoPago: metodo }))
                            if (errores.metodoPago) setErrores(er => ({ ...er, metodoPago: '' }))
                          }}
                          className={`flex w-full items-center justify-between rounded-full border px-4 py-3.5 text-left transition-colors ${
                            datos.metodoPago === metodo
                              ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]'
                          }`}
                        >
                          <span className="text-[14px] font-bold">{metodo}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                              datos.metodoPago === metodo
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                                : 'border-[var(--border)]'
                            }`}
                          >
                            {datos.metodoPago === metodo && (
                              <span className="block h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errores.metodoPago && (
                    <p className="mt-2 text-[12px] font-medium text-red-400">{errores.metodoPago}</p>
                  )}
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={FileText}>Notas adicionales</SectionTitle>
                  <p className="mb-3 text-[12px] font-medium text-[var(--text-subtle)]">Opcional</p>
                  <textarea
                    value={datos.notas}
                    onChange={e => setDatos(d => ({ ...d, notas: e.target.value }))}
                    placeholder="Indicaciones especiales para la entrega, referencias, etc."
                    rows={3}
                    className="w-full resize-none rounded-[20px] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-[14px] font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:bg-white"
                  />
                </section>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStep('carrito')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3.5 text-[13px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-deep)]"
                  >
                    <ChevronLeft size={14} />
                    Volver
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmar}
                    className="catalog-gold-cta flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold"
                  >
                    Revisar pedido
                    <ChevronRight size={14} />
                  </motion.button>
                </div>
              </div>

              <CartSidebar className="hidden lg:block" top={stickyTop}>
                <OrderSummaryPanel
                  items={items}
                  subtotal={subtotal}
                  catalogType={catalogType}
                />
              </CartSidebar>
            </motion.div>
          )}

          {/* STEP 3: RESUMEN */}
          {step === 'resumen' && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl space-y-6"
            >
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F8EE] text-[#25D366]">
                    <WhatsAppIcon size={18} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">
                      Resumen del pedido
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-[var(--text-muted)]">
                      Esto es lo que se enviará por WhatsApp
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <section>
                    <p className="mb-3 text-[12px] font-bold text-[var(--accent-deep)]">
                      Datos del cliente
                    </p>
                    <dl className="space-y-2.5">
                      {[
                        { label: 'Nombre', value: datos.nombre },
                        { label: 'Celular', value: datos.celular },
                        { label: 'Ciudad', value: datos.ciudad },
                        { label: 'Dirección', value: datos.direccion },
                        { label: 'Pago', value: datos.metodoPago },
                        ...(datos.notas ? [{ label: 'Notas', value: datos.notas }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-4 text-[13px] font-medium">
                          <dt className="w-20 shrink-0 text-[var(--text-subtle)]">{label}</dt>
                          <dd className="font-bold text-[var(--text-primary)]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section className="border-t border-[var(--border)] pt-6">
                    <p className="mb-4 text-[12px] font-bold text-[var(--accent-deep)]">
                      Productos
                    </p>
                    <div className="space-y-3">
                      {items.map(item => {
                        const key = itemLineKey(item)
                        const { producto, cantidad, variacionesSeleccionadas } = item
                        const vars = formatVariacionesResumen(variacionesSeleccionadas)

                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-[var(--bg-muted)]">
                              {producto.imagenes?.[0] && (
                                <img
                                  src={producto.imagenes[0]}
                                  alt={producto.nombre}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                                {producto.nombre}
                              </p>
                              {vars && (
                                <p className={`truncate ${variacionesCarritoClassName}`}>{vars}</p>
                              )}
                              <p className="text-[11px] font-medium text-[var(--text-subtle)]">
                                × {cantidad}
                              </p>
                            </div>
                            <p className="shrink-0 text-[13px] font-bold text-[var(--accent-deep)]">
                              {(() => {
                                const line = itemLineTotal(item, catalogType)
                                return line != null ? formatPrecio(line) : 'Consultar'
                              })()}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="border-t border-[var(--border)] pt-6">
                    <p className="mb-4 flex items-center gap-2 text-[12px] font-bold text-[var(--accent-deep)]">
                      <Package size={13} className="text-[var(--accent-primary)]" />
                      Resumen de costos
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-[var(--text-muted)]">Subtotal</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {formatPrecio(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-[var(--text-muted)]">Envío</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {envioGratis
                            ? 'Gratis'
                            : costoEnvio === 0
                              ? 'A convenir'
                              : formatPrecio(costoEnvio)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-[var(--text-muted)]">Entrega</span>
                        <span className="font-bold text-[var(--text-primary)]">{tiempoEntrega}</span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-4">
                        <span className="text-[13px] font-bold text-[var(--text-secondary)]">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-[var(--accent-deep)]">
                          {formatPrecio(totalFinal)}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep('datos')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3.5 text-[13px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-deep)]"
                >
                  <ChevronLeft size={14} />
                  Volver
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnviarWhatsApp}
                  disabled={enviando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 text-[14px] font-bold text-white transition-colors hover:bg-[#22c55e] disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Abriendo WhatsApp...
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon size={16} />
                      Enviar pedido por WhatsApp
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-center text-[12px] font-medium leading-relaxed text-[var(--text-subtle)]">
                Al confirmar, se abrirá WhatsApp con tu pedido listo para enviar. El pedido no se
                procesa hasta que lo envíes por WhatsApp.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  )
}
