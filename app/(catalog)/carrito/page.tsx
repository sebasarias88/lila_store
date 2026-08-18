'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useCarrito } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { DatosCliente, ItemCarrito, MetodoPago } from '@/types'
import { generarMensajeWhatsApp, abrirWhatsApp } from '@/lib/whatsapp'
import {
  cartSubtotal,
  formatVariacionesResumen,
  itemLineKey,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { parseCopValue } from '@/lib/currency'
import {
  catalogPath,
  CONFIG_MAYORISTA_MINIMO,
  CONFIG_MAYORISTA_RECOMPRA,
  MAYOREO_MIN_COMPRA,
  MAYOREO_RECOMPRA,
  parseMayoristaConfigMonto,
  type CatalogType,
} from '@/lib/catalog'
import {
  WHATSAPP_CONSULTA_NUMERO,
  resolveWhatsAppPedidoNumero,
} from '@/lib/negocio'
import {
  buildResumenRecargoPago,
  metodoPagoToOpcion,
} from '@/lib/payment-methods'
import {
  mensajeStockRestante,
  stockRestanteParaProducto,
  validarStockCarrito,
  type StockProductoFresh,
} from '@/lib/stock'
import {
  datosTransferenciaDesdeConfig,
  esMetodoTransferencia,
  subirComprobantePago,
} from '@/lib/transferencia'
import EntregaPicker from '@/components/catalog/cart/EntregaPicker'
import MetodoPagoPicker from '@/components/catalog/cart/MetodoPagoPicker'
import TransferenciaCheckout from '@/components/catalog/cart/TransferenciaCheckout'
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
  Heart,
  Store,
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
  mayorista_valor_minimo_compra: string
  mayorista_valor_recompra: string
  transferencia_activo: string
  transferencia_banco: string
  transferencia_tipo_cuenta: string
  transferencia_numero_cuenta: string
  transferencia_titular: string
  transferencia_llave: string
}

type Step = 'carrito' | 'datos' | 'resumen'

const CIUDADES_ARMENIA = ['armenia', 'armenia quindío', 'armenia quindio']

const STEPS: { id: Step; label: string }[] = [
  { id: 'carrito', label: 'Bolsita' },
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
  esRecogida = false,
  recargoLabel = null,
  recargoMonto = 0,
}: {
  items: ItemCarrito[]
  subtotal: number
  catalogType: CatalogType
  envio?: number
  total?: number
  tiempoEntrega?: string
  envioGratis?: boolean
  showEnvio?: boolean
  esRecogida?: boolean
  recargoLabel?: string | null
  recargoMonto?: number
}) {
  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-[var(--accent-primary)]" />
        <p className="text-[13px] font-bold text-[var(--accent-deep)]">Tu resumen ✨</p>
      </div>

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
                {esRecogida
                  ? 'Sin envío'
                  : envioGratis
                    ? 'Gratis 💕'
                    : envio === 0
                      ? 'A convenir'
                      : formatPrecio(envio ?? 0)}
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
        {recargoLabel && recargoMonto > 0 ? (
          <div className="flex justify-between text-[13px] font-medium">
            <span className="text-[var(--text-muted)]">{recargoLabel}</span>
            <span className="font-bold text-[var(--text-primary)]">
              +{formatPrecio(recargoMonto)}
            </span>
          </div>
        ) : null}
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

  const { items, quitar, actualizarCantidad, vaciar, aplicarStockFresco } =
    useCarrito()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>('carrito')
  const [config, setConfig] = useState<Config>({
    whatsapp_numero: WHATSAPP_CONSULTA_NUMERO,
    envio_armenia: '5000',
    envio_nacional: '0',
    envio_gratis_desde: '0',
    tiempo_entrega_armenia: 'El mismo día',
    tiempo_entrega_nacional: '2 a 3 días hábiles',
    mayorista_valor_minimo_compra: String(MAYOREO_MIN_COMPRA),
    mayorista_valor_recompra: String(MAYOREO_RECOMPRA),
    transferencia_activo: 'false',
    transferencia_banco: '',
    transferencia_tipo_cuenta: '',
    transferencia_numero_cuenta: '',
    transferencia_titular: '',
    transferencia_llave: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [metodosPagoDb, setMetodosPagoDb] = useState<MetodoPago[]>([])
  const [comprobantePago, setComprobantePago] = useState<File | null>(null)

  const [datos, setDatos] = useState<DatosCliente>({
    nombre: '',
    celular: '',
    direccion: '',
    ciudad: '',
    metodoPago: '',
    notas: '',
    tipoEntrega: 'envio',
    sucursalRecogida: '',
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
        whatsapp_numero: map['whatsapp_numero'] || WHATSAPP_CONSULTA_NUMERO,
        envio_armenia: map['envio_armenia'] || '5000',
        envio_nacional: map['envio_nacional'] || '0',
        envio_gratis_desde: map['envio_gratis_desde'] || '0',
        tiempo_entrega_armenia: map['tiempo_entrega_armenia'] || 'El mismo día',
        tiempo_entrega_nacional: map['tiempo_entrega_nacional'] || '2 a 3 días hábiles',
        mayorista_valor_minimo_compra:
          map[CONFIG_MAYORISTA_MINIMO] ?? String(MAYOREO_MIN_COMPRA),
        mayorista_valor_recompra:
          map[CONFIG_MAYORISTA_RECOMPRA] ?? String(MAYOREO_RECOMPRA),
        transferencia_activo: map['transferencia_activo'] || 'false',
        transferencia_banco: map['transferencia_banco'] || '',
        transferencia_tipo_cuenta: map['transferencia_tipo_cuenta'] || '',
        transferencia_numero_cuenta: map['transferencia_numero_cuenta'] || '',
        transferencia_titular: map['transferencia_titular'] || '',
        transferencia_llave: map['transferencia_llave'] || '',
      })
    }
  }, [])

  const fetchMetodosPago = useCallback(async () => {
    const { data, error } = await supabase
      .from('metodos_pago')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) {
      console.error('[carrito] metodos_pago:', error)
      setMetodosPagoDb([])
      return
    }
    setMetodosPagoDb((data as MetodoPago[]) || [])
  }, [])

  useEffect(() => {
    setMounted(true)
    void fetchConfig()
    void fetchMetodosPago()
  }, [fetchConfig, fetchMetodosPago])

  const esRecogida = datos.tipoEntrega === 'recogida'
  const transferencia = useMemo(
    () => datosTransferenciaDesdeConfig(config),
    [config],
  )

  const metodosPago = useMemo(
    () =>
      metodosPagoDb
        .filter(m => transferencia.activo || !esMetodoTransferencia(m.nombre))
        .map(m => metodoPagoToOpcion(m, catalogType)),
    [metodosPagoDb, catalogType, transferencia.activo],
  )
  const esTransferencia = esMetodoTransferencia(datos.metodoPago)
  const esArmenia = CIUDADES_ARMENIA.includes(datos.ciudad.toLowerCase().trim())
  const subtotal = useMemo(
    () => cartSubtotal(items, catalogType),
    [items, catalogType],
  )
  const envioGratisDesde = parseCopValue(config.envio_gratis_desde)
  const envioGratis = !esRecogida && envioGratisDesde > 0 && subtotal >= envioGratisDesde

  const costoEnvio = esRecogida
    ? 0
    : envioGratis
      ? 0
      : esArmenia
        ? parseCopValue(config.envio_armenia)
        : parseCopValue(config.envio_nacional)

  const tiempoEntrega = esRecogida
    ? 'Recoger en tienda'
    : esArmenia
      ? config.tiempo_entrega_armenia
      : config.tiempo_entrega_nacional

  const recargoPago = useMemo(
    () =>
      buildResumenRecargoPago(
        metodosPagoDb,
        datos.metodoPago,
        subtotal,
        catalogType,
      ),
    [metodosPagoDb, datos.metodoPago, subtotal, catalogType],
  )
  const recargoMonto = recargoPago?.monto ?? 0
  const totalFinal = subtotal + costoEnvio + recargoMonto

  // Si el método elegido ya no está activo, limpiarlo
  useEffect(() => {
    if (!datos.metodoPago || metodosPago.length === 0) return
    const ok = metodosPago.some(m => m.label === datos.metodoPago)
    if (!ok) setDatos(d => ({ ...d, metodoPago: '' }))
  }, [metodosPago, datos.metodoPago])
  const stepIndex = STEPS.findIndex(s => s.id === step)
  const stickyTop = catalogType === 'mayoreo' ? 100 : 96

  const minimoMayoreo =
    catalogType === 'mayoreo'
      ? parseMayoristaConfigMonto(
          config.mayorista_valor_minimo_compra,
          MAYOREO_MIN_COMPRA,
        )
      : 0
  const recompraSugerida =
    catalogType === 'mayoreo'
      ? parseMayoristaConfigMonto(
          config.mayorista_valor_recompra,
          MAYOREO_RECOMPRA,
        )
      : 0
  const cumpleMinimo = catalogType !== 'mayoreo' || subtotal >= minimoMayoreo
  const faltaParaMinimo = Math.max(0, minimoMayoreo - subtotal)
  const mensajeMinimoMayoreo = `Tu pedido debe ser de al menos ${formatPrecio(minimoMayoreo)} para el catálogo mayorista. Te faltan ${formatPrecio(faltaParaMinimo)}`

  const validar = () => {
    const e: Partial<DatosCliente> = {}
    if (!datos.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!datos.celular.trim()) e.celular = 'El celular es requerido'
    else if (!/^[0-9+\s]{7,15}$/.test(datos.celular.trim())) e.celular = 'Número inválido'
    if (!esRecogida) {
      if (!datos.direccion.trim()) e.direccion = 'La dirección es requerida'
      if (!datos.ciudad.trim()) e.ciudad = 'La ciudad es requerida'
    }
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
      toast.error(mensajeMinimoMayoreo)
      return
    }
    if (esRecogida && !datos.sucursalRecogida.trim()) {
      setErrores(er => ({ ...er, sucursalRecogida: 'Elige en qué tienda recoges' }))
      toast.error('Elige la tienda donde vas a recoger')
      return
    }
    setErrores(er => ({ ...er, sucursalRecogida: '' }))
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

  const handleEnviarWhatsApp = async () => {
    if (catalogType === 'mayoreo' && !cumpleMinimo) {
      toast.error(mensajeMinimoMayoreo)
      return
    }
    if (items.length === 0) {
      toast.error('Tu carrito está vacío')
      return
    }

    setEnviando(true)
    try {
      const ids = [...new Set(items.map(i => i.producto.id))]
      const { data, error } = await supabase
        .from('productos')
        .select(
          'id, nombre, stock_detal, stock_mayoreo, disponible, disponible_detal, disponible_mayoreo',
        )
        .in('id', ids)

      if (error || !data) {
        console.error('[carrito] stock revalidate:', error)
        toast.error('No pudimos verificar el stock. Intenta de nuevo.')
        return
      }

      const freshById = Object.fromEntries(
        (data as StockProductoFresh[]).map(p => [p.id, p]),
      ) as Record<string, StockProductoFresh>

      aplicarStockFresco(freshById)

      const stockOk = validarStockCarrito(
        useCarrito.getState().items,
        freshById,
        catalogType,
      )
      if (!stockOk.ok) {
        toast.error(stockOk.message)
        return
      }

      let comprobanteUrl: string | null = null
      if (esTransferencia && comprobantePago) {
        const uploaded = await subirComprobantePago(comprobantePago)
        if (!uploaded.ok) {
          toast.error(uploaded.message)
          return
        }
        comprobanteUrl = uploaded.url
      }

      const mensaje = generarMensajeWhatsApp(
        useCarrito.getState().items,
        datos,
        costoEnvio,
        tiempoEntrega,
        catalogType,
        recargoPago
          ? { labelLinea: recargoPago.labelLinea, monto: recargoPago.monto }
          : null,
        comprobanteUrl,
      )
      abrirWhatsApp(mensaje, resolveWhatsAppPedidoNumero())
      vaciar()
      setComprobantePago(null)
      toast.success('¡Pedido listo! Revisa tu WhatsApp ✨')
    } finally {
      setEnviando(false)
    }
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
          recompraSugerida={recompraSugerida}
          cumpleMinimo={cumpleMinimo}
          faltaParaMinimo={faltaParaMinimo}
          mensajeMinimoMayoreo={mensajeMinimoMayoreo}
          datos={datos}
          setDatos={setDatos}
          errores={errores}
          setErrores={setErrores}
          metodosPago={metodosPago}
          transferencia={transferencia}
          esTransferencia={esTransferencia}
          comprobantePago={comprobantePago}
          onComprobanteChange={setComprobantePago}
          enviando={enviando}
          costoEnvio={costoEnvio}
          envioGratis={envioGratis}
          tiempoEntrega={tiempoEntrega}
          totalFinal={totalFinal}
          recargoLabel={recargoPago?.labelLinea ?? null}
          recargoMonto={recargoMonto}
          handleContinuar={handleContinuar}
          handleConfirmar={handleConfirmar}
          handleEnviarWhatsApp={handleEnviarWhatsApp}
          inputClass={inputClass}
        />
      </div>

      {/* ── Desktop ── */}
      <div className="relative hidden min-h-screen bg-[var(--bg-base)] pb-16 pt-28 sm:pt-32 md:block">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[rgba(169,137,224,0.08)] to-transparent" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-1.5">
            <Heart size={13} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">
              Tu bolsita ✨
            </span>
          </div>
          <h1 className="text-[1.85rem] font-bold leading-none text-[var(--text-primary)] sm:text-[2.15rem]">
            {step === 'carrito' && 'Carrito cute'}
            {step === 'datos' && 'Tus datos 💕'}
            {step === 'resumen' && 'Revisa y confirma ✨'}
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            {step === 'carrito' && 'Tus tesoros listos para consentirte'}
            {step === 'datos' &&
              (esRecogida
                ? 'Solo necesitamos tus datos de contacto'
                : 'Cuéntanos a dónde enviamos tu pedido')}
            {step === 'resumen' && 'Último pasito antes de confirmar'}
          </p>

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
                      ? 'bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]'
                      : i < stepIndex
                        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)] hover:bg-white'
                        : 'cursor-default text-[var(--text-faint)]'
                  }`}
                >
                  <span
                    className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums ${
                      step === s.id
                        ? 'bg-white/25 text-white'
                        : 'bg-white text-[var(--accent-deep)] shadow-sm'
                    }`}
                  >
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
                  <div className="flex flex-col items-center rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[#F9F6FF] to-[#F8EAF4] py-16 text-center shadow-[var(--shadow-soft)]">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--accent-primary)] shadow-[var(--shadow-soft)]">
                      <Heart size={28} className="fill-[var(--accent-primary)]" />
                    </span>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">
                      Tu bolsita está vacía 💕
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-[var(--text-muted)]">
                      Agrega algo cute y vuelve aquí ✨
                    </p>
                    <Link
                      href={productosHref}
                      className="catalog-gold-cta mt-6 rounded-full px-5 py-2.5 text-[13px] font-bold"
                    >
                      Explorar tesoros ✨
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-1">
                    <AnimatePresence initial={false}>
                      {items.map(item => {
                        const key = itemLineKey(item)
                        const { producto, cantidad, variacionesSeleccionadas } = item
                        const vars = formatVariacionesResumen(variacionesSeleccionadas)
                        const maxQty =
                          stockRestanteParaProducto(
                            producto,
                            items,
                            catalogType,
                            key,
                          ) + cantidad
                        const atMax = cantidad >= maxQty
                        const restantesLinea = stockRestanteParaProducto(
                          producto,
                          items,
                          catalogType,
                        )

                        return (
                          <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-4 rounded-[20px] px-2 py-4 transition-colors hover:bg-[var(--bg-muted)]/70"
                          >
                            <Link
                              href={catalogPath(catalogType, `/productos/${producto.slug}`)}
                              className="h-24 w-20 shrink-0 overflow-hidden rounded-[16px] bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)] ring-1 ring-[var(--border)] sm:h-28 sm:w-24"
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
                                <div>
                                  <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-white p-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        actualizarCantidad(key, cantidad - 1, catalogType)
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)]"
                                      aria-label="Disminuir cantidad"
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center text-[14px] font-bold text-[var(--text-primary)]">
                                      {cantidad}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const result = actualizarCantidad(
                                          key,
                                          cantidad + 1,
                                          catalogType,
                                        )
                                        if (!result.ok) toast.error(result.message)
                                      }}
                                      disabled={atMax}
                                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Aumentar cantidad"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </div>
                                  {atMax ? (
                                    <p className="mt-1 text-[11px] font-medium text-[var(--accent-deep)]">
                                      {mensajeStockRestante(restantesLinea)}
                                    </p>
                                  ) : null}
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
                                      toast.success('Listo, lo quitamos ✨')
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-subtle)] transition-colors hover:bg-white hover:text-red-400"
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

                    <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                      <EntregaPicker
                        tipoEntrega={datos.tipoEntrega}
                        sucursalRecogida={datos.sucursalRecogida}
                        error={errores.sucursalRecogida}
                        onTipoChange={tipo => {
                          setDatos(d => ({
                            ...d,
                            tipoEntrega: tipo,
                            sucursalRecogida: tipo === 'envio' ? '' : d.sucursalRecogida,
                          }))
                          if (errores.sucursalRecogida) {
                            setErrores(er => ({ ...er, sucursalRecogida: '' }))
                          }
                        }}
                        onSucursalChange={label => {
                          setDatos(d => ({ ...d, sucursalRecogida: label }))
                          if (errores.sucursalRecogida) {
                            setErrores(er => ({ ...er, sucursalRecogida: '' }))
                          }
                        }}
                      />
                    </section>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-6">
                  <OrderSummaryPanel
                    items={items}
                    subtotal={subtotal}
                    catalogType={catalogType}
                    envio={costoEnvio}
                    total={esRecogida ? totalFinal : undefined}
                    tiempoEntrega={esRecogida ? tiempoEntrega : undefined}
                    envioGratis={envioGratis}
                    showEnvio={esRecogida}
                    esRecogida={esRecogida}
                    recargoLabel={recargoPago?.labelLinea ?? null}
                    recargoMonto={recargoMonto}
                  />
                  {catalogType === 'mayoreo' && (
                    <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border))] bg-[var(--bg-muted)] p-4">
                      <p className="text-[13px] font-bold text-[var(--accent-deep)]">
                        Pedido mínimo: {formatPrecio(minimoMayoreo)}
                      </p>
                      {recompraSugerida > 0 ? (
                        <p className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">
                          Pedidos posteriores: mínimo sugerido{' '}
                          {formatPrecio(recompraSugerida)}
                        </p>
                      ) : null}
                      {!cumpleMinimo ? (
                        <p className="mt-2 text-[13px] font-medium leading-relaxed text-[var(--text-secondary)]">
                          {mensajeMinimoMayoreo}
                        </p>
                      ) : null}
                    </div>
                  )}
                  <p className="text-[12px] font-medium text-[var(--text-subtle)]">
                    {esRecogida
                      ? datos.sucursalRecogida
                        ? 'Listo: recoges en tienda sin costo de envío 💕'
                        : 'Elige la tienda donde quieres recoger ✨'
                      : 'El envío se calcula según tu ciudad 💕'}
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
                    Continuar ✨
                    <ChevronRight size={14} />
                  </motion.button>
                  <Link
                    href={productosHref}
                    className="block text-center text-[13px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-deep)]"
                  >
                    ← Seguir explorando 💕
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
                  <SectionTitle icon={User}>Datos personales 💕</SectionTitle>
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
                  {esRecogida ? (
                    <>
                      <SectionTitle icon={Store}>Recoges en tienda ✨</SectionTitle>
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3.5">
                        <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                          Sucursal elegida
                        </p>
                        <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--text-primary)]">
                          {datos.sucursalRecogida}
                        </p>
                        <p className="mt-2 text-[12px] font-medium text-[var(--text-muted)]">
                          Sin costo de envío · te avisamos cuando esté listo
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('carrito')
                          scrollTop()
                        }}
                        className="mt-3 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:text-[var(--accent-primary)]"
                      >
                        Cambiar tienda o tipo de entrega
                      </button>
                    </>
                  ) : (
                    <>
                      <SectionTitle icon={MapPin}>Dirección de entrega ✨</SectionTitle>
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
                            <p className="mt-1.5 text-[12px] font-medium text-red-400">
                              {errores.ciudad}
                            </p>
                          )}
                          {datos.ciudad.trim() && (
                            <motion.p
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2.5 flex items-start gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-2 text-[12px] font-medium text-[var(--accent-deep)]"
                            >
                              <Truck
                                size={13}
                                className="mt-0.5 shrink-0 text-[var(--accent-primary)]"
                              />
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
                            <p className="mt-1.5 text-[12px] font-medium text-red-400">
                              {errores.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={CreditCard}>Cómo quieres pagar ✨</SectionTitle>
                  <p className="mb-4 text-[12px] font-medium text-[var(--text-muted)]">
                    Elige el medio — ePayco incluye tarjeta, PSE y más
                  </p>
                  <MetodoPagoPicker
                    metodos={metodosPago}
                    selected={datos.metodoPago}
                    error={errores.metodoPago}
                    onSelect={label => {
                      setDatos(d => ({ ...d, metodoPago: label }))
                      if (errores.metodoPago) setErrores(er => ({ ...er, metodoPago: '' }))
                      if (!esMetodoTransferencia(label)) setComprobantePago(null)
                    }}
                  />
                  {esTransferencia && transferencia.activo ? (
                    <TransferenciaCheckout
                      datos={transferencia}
                      totalLabel={formatPrecio(totalFinal)}
                      comprobante={comprobantePago}
                      onComprobanteChange={setComprobantePago}
                    />
                  ) : null}
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={FileText}>Notitas extras 💕</SectionTitle>
                  <p className="mb-3 text-[12px] font-medium text-[var(--text-subtle)]">Opcional</p>
                  <textarea
                    value={datos.notas}
                    onChange={e => setDatos(d => ({ ...d, notas: e.target.value }))}
                    placeholder={
                      esRecogida
                        ? 'Algo que debamos saber para tu recogida… ✨'
                        : 'Indicaciones especiales, referencias del edificio… ✨'
                    }
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
                    Revisar pedido ✨
                    <ChevronRight size={14} />
                  </motion.button>
                </div>
              </div>

              <CartSidebar className="hidden lg:block" top={stickyTop}>
                <OrderSummaryPanel
                  items={items}
                  subtotal={subtotal}
                  catalogType={catalogType}
                  envio={costoEnvio}
                  total={totalFinal}
                  tiempoEntrega={tiempoEntrega}
                  envioGratis={envioGratis}
                  showEnvio
                  esRecogida={esRecogida}
                  recargoLabel={recargoPago?.labelLinea ?? null}
                  recargoMonto={recargoMonto}
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
              className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14"
            >
              <div className="min-w-0 space-y-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                    {catalogType === 'mayoreo' ? (
                      <WhatsAppIcon size={18} />
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">
                      Resumen del pedido ✨
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-[var(--text-muted)]">
                      {catalogType === 'mayoreo'
                        ? 'Lo enviamos por WhatsApp para confirmar juntos'
                        : 'Revisa todo — por ahora confirmamos por WhatsApp'}
                    </p>
                  </div>
                </div>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={User}>Datos del cliente 💕</SectionTitle>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Nombre', value: datos.nombre },
                      { label: 'Celular', value: datos.celular },
                      ...(esRecogida
                        ? [{ label: 'Recoger en', value: datos.sucursalRecogida }]
                        : [
                            { label: 'Ciudad', value: datos.ciudad },
                            { label: 'Dirección', value: datos.direccion },
                          ]),
                      { label: 'Pago', value: datos.metodoPago },
                      ...(esTransferencia && comprobantePago
                        ? [{ label: 'Comprobante', value: comprobantePago.name }]
                        : []),
                      ...(datos.notas ? [{ label: 'Notas', value: datos.notas }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-[11px] font-bold text-[var(--text-subtle)]">{label}</dt>
                        <dd className="mt-0.5 text-[13px] font-bold text-[var(--text-primary)]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                  <SectionTitle icon={Package}>Tus tesoros</SectionTitle>
                  <div className="space-y-3">
                    {items.map(item => {
                      const key = itemLineKey(item)
                      const { producto, cantidad, variacionesSeleccionadas } = item
                      const vars = formatVariacionesResumen(variacionesSeleccionadas)

                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[var(--bg-muted)]">
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

                <section className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:hidden">
                  <SectionTitle icon={Package}>Totales</SectionTitle>
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
                        {esRecogida
                          ? 'Sin envío'
                          : envioGratis
                            ? 'Gratis 💕'
                            : costoEnvio === 0
                              ? 'A convenir'
                              : formatPrecio(costoEnvio)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] font-medium">
                      <span className="text-[var(--text-muted)]">Entrega</span>
                      <span className="font-bold text-[var(--text-primary)]">{tiempoEntrega}</span>
                    </div>
                    {recargoPago && recargoMonto > 0 ? (
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-[var(--text-muted)]">
                          {recargoPago.labelLinea}
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          +{formatPrecio(recargoMonto)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3">
                      <span className="text-[13px] font-bold text-[var(--text-secondary)]">
                        Total
                      </span>
                      <span className="text-xl font-bold text-[var(--accent-deep)]">
                        {formatPrecio(totalFinal)}
                      </span>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row lg:hidden">
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
                    disabled={enviando || (catalogType === 'mayoreo' && !cumpleMinimo)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold transition-colors disabled:opacity-60 ${
                      catalogType === 'mayoreo'
                        ? 'bg-[#25D366] text-white hover:bg-[#22c55e]'
                        : 'catalog-gold-cta'
                    }`}
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Abriendo WhatsApp...
                      </>
                    ) : catalogType === 'mayoreo' ? (
                      <>
                        <WhatsAppIcon size={16} />
                        Enviar por WhatsApp
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Confirmar pedido ✨
                      </>
                    )}
                  </motion.button>
                </div>

                  {catalogType === 'mayoreo' && !cumpleMinimo ? (
                    <p className="text-[12px] font-medium leading-relaxed text-[var(--accent-deep)] lg:hidden">
                      {mensajeMinimoMayoreo}
                    </p>
                  ) : null}

                  {catalogType === 'detal' && (
                    <p className="text-[12px] font-medium leading-relaxed text-[var(--text-subtle)] lg:hidden">
                      Por ahora confirmamos por WhatsApp. Las pasarelas quedan listas en el pedido 💕
                    </p>
                  )}
              </div>

              <CartSidebar className="hidden lg:block" top={stickyTop}>
                <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-[var(--accent-primary)]" />
                    <p className="text-[13px] font-bold text-[var(--accent-deep)]">Totales ✨</p>
                  </div>

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
                        {esRecogida
                          ? 'Sin envío'
                          : envioGratis
                            ? 'Gratis 💕'
                            : costoEnvio === 0
                              ? 'A convenir'
                              : formatPrecio(costoEnvio)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] font-medium">
                      <span className="text-[var(--text-muted)]">Entrega</span>
                      <span className="font-bold text-[var(--text-primary)]">{tiempoEntrega}</span>
                    </div>
                    {recargoPago && recargoMonto > 0 ? (
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-[var(--text-muted)]">
                          {recargoPago.labelLinea}
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          +{formatPrecio(recargoMonto)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-4">
                      <span className="text-[13px] font-bold text-[var(--text-secondary)]">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-[var(--accent-deep)]">
                        {formatPrecio(totalFinal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('datos')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-3 text-[13px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--accent-deep)]"
                  >
                    <ChevronLeft size={14} />
                    Volver a datos
                  </button>

                  {catalogType === 'mayoreo' && !cumpleMinimo ? (
                    <p className="text-[12px] font-medium leading-relaxed text-[var(--accent-deep)]">
                      {mensajeMinimoMayoreo}
                    </p>
                  ) : null}

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnviarWhatsApp}
                    disabled={enviando || (catalogType === 'mayoreo' && !cumpleMinimo)}
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold transition-colors disabled:opacity-60 ${
                      catalogType === 'mayoreo'
                        ? 'bg-[#25D366] text-white hover:bg-[#22c55e]'
                        : 'catalog-gold-cta'
                    }`}
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Abriendo WhatsApp...
                      </>
                    ) : catalogType === 'mayoreo' ? (
                      <>
                        <WhatsAppIcon size={16} />
                        Enviar por WhatsApp
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Confirmar pedido ✨
                      </>
                    )}
                  </motion.button>

                  <p className="text-[12px] font-medium leading-relaxed text-[var(--text-subtle)]">
                    {catalogType === 'mayoreo'
                      ? 'Al confirmar se abrirá WhatsApp con tu pedido listo para enviar.'
                      : 'Por ahora confirmamos por WhatsApp con tu medio de pago elegido 💕'}
                  </p>
                </div>
              </CartSidebar>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  )
}
