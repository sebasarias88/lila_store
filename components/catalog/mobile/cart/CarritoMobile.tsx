'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  MapPin,
  User,
  CreditCard,
  FileText,
  Truck,
  Package,
  Phone,
  Sparkles,
  Store,
  Paperclip,
} from 'lucide-react'
import { ItemCarrito, DatosCliente } from '@/types'
import { type CatalogType } from '@/lib/catalog'
import type { MetodoPagoOpcion } from '@/lib/payment-methods'
import type { DatosTransferencia } from '@/lib/transferencia'
import { esMetodoTransferencia } from '@/lib/transferencia'
import EntregaPicker from '@/components/catalog/cart/EntregaPicker'
import MetodoPagoPicker from '@/components/catalog/cart/MetodoPagoPicker'
import TransferenciaCheckout from '@/components/catalog/cart/TransferenciaCheckout'
import MobileCartSteps, { type Step } from '@/components/catalog/mobile/cart/MobileCartSteps'
import { PAGOS_COPY } from '@/lib/pagos-proximos'
import MobileCartItem, { formatPrecio } from '@/components/catalog/mobile/cart/MobileCartItem'
import MobileCartSummary from '@/components/catalog/mobile/cart/MobileCartSummary'
import MobileCartStickyBar from '@/components/catalog/mobile/cart/MobileCartStickyBar'
import MobileCartReviewItem from '@/components/catalog/mobile/cart/MobileCartReviewItem'
import CartCheckoutSuccess from '@/components/catalog/cart/CartCheckoutSuccess'
import { itemLineKey } from '@/lib/cart'
import {
  mensajeStockRestante,
  stockRestanteParaProducto,
} from '@/lib/stock'
import toast from 'react-hot-toast'

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

type CarritoMobileProps = {
  catalogType: CatalogType
  productosHref: string
  step: Step
  setStep: (step: Step) => void
  stepIndex: number
  items: ItemCarrito[]
  quitar: (key: string) => void
  actualizarCantidad: (
    key: string,
    cantidad: number,
    catalogType?: CatalogType,
  ) => { ok: true } | { ok: false; message: string }
  subtotal: number
  minimoMayoreo: number
  recompraSugerida: number
  cumpleMinimo: boolean
  faltaParaMinimo: number
  mensajeMinimoMayoreo: string
  datos: DatosCliente
  setDatos: React.Dispatch<React.SetStateAction<DatosCliente>>
  errores: Partial<DatosCliente>
  setErrores: React.Dispatch<React.SetStateAction<Partial<DatosCliente>>>
  metodosPago: MetodoPagoOpcion[]
  transferencia: DatosTransferencia
  esTransferencia: boolean
  comprobantePago: File | null
  onComprobanteChange: (file: File | null) => void
  enviando: boolean
  costoEnvio: number
  envioGratis: boolean
  tiempoEntrega: string
  totalFinal: number
  recargoLabel?: string | null
  recargoMonto?: number
  handleContinuar: () => void
  handleConfirmar: () => void
  handleEnviarWhatsApp: () => void | Promise<void>
  handleReabrirWhatsApp: () => void
  handleConfirmarPedidoEnviado: () => void
  whatsappHref?: string | null
  inputClass: (campo: keyof DatosCliente) => string
}

function CartFormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mobile-cart-checkout-field${error ? ' mobile-cart-checkout-field--error' : ''}`}>
      <label htmlFor={id} className="mobile-cart-checkout-field__label">
        {label}
        {required ? <span className="text-[var(--accent-primary)]"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mobile-cart-checkout-field__error">{error}</p> : null}
    </div>
  )
}

const checkoutInputClass = 'mobile-cart-checkout-field__input'

export default function CarritoMobile({
  catalogType,
  productosHref,
  step,
  setStep,
  stepIndex,
  items,
  quitar,
  actualizarCantidad,
  subtotal,
  minimoMayoreo,
  recompraSugerida,
  cumpleMinimo,
  faltaParaMinimo,
  mensajeMinimoMayoreo,
  datos,
  setDatos,
  errores,
  setErrores,
  metodosPago,
  transferencia,
  esTransferencia,
  comprobantePago,
  onComprobanteChange,
  enviando,
  costoEnvio,
  envioGratis,
  tiempoEntrega,
  totalFinal,
  recargoLabel = null,
  recargoMonto = 0,
  handleContinuar,
  handleConfirmar,
  handleEnviarWhatsApp,
  handleReabrirWhatsApp,
  handleConfirmarPedidoEnviado,
  whatsappHref = null,
  inputClass,
}: CarritoMobileProps) {
  const esRecogida = datos.tipoEntrega === 'recogida'
  const stickySpacer =
    step === 'exito'
      ? 'h-[calc(2rem+env(safe-area-inset-bottom,0px))]'
      : step === 'resumen'
      ? 'h-[calc(10.5rem+env(safe-area-inset-bottom,0px))]'
      : step === 'datos'
        ? 'h-[calc(9rem+env(safe-area-inset-bottom,0px))]'
        : 'h-[calc(7.5rem+env(safe-area-inset-bottom,0px))]'

  return (
    <div className="mobile-catalog-page mobile-cart-page relative z-10 mx-auto max-w-lg px-4 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--accent-primary)]" />
          <span className="text-[12px] font-bold text-[var(--accent-deep)]">Mi pedido</span>
        </div>
        <h1 className="text-[1.65rem] font-bold tracking-tight text-[var(--text-primary)]">
          Tu carrito
        </h1>
      </motion.div>

      <div className="mb-6">
        <MobileCartSteps
          step={step}
          stepIndex={stepIndex}
          onStepClick={setStep}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 'carrito' && (
          <motion.div
            key="carrito"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--shadow-soft)]">
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
                  className="catalog-gold-cta mt-6 flex min-h-[52px] w-full max-w-xs items-center justify-center rounded-full text-[13px] font-bold"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <>
                <div className="mobile-cart-list-panel">
                  <div className="mobile-cart-list-panel__header">
                    <div className="flex min-w-0 items-end justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                          Tu selección
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">
                          {items.length} artículo{items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="mobile-cart-list-panel__count">{items.length}</span>
                    </div>
                  </div>
                  <div className="mobile-cart-item-list">
                    <AnimatePresence initial={false}>
                      {items.map(item => {
                        const key = itemLineKey(item)
                        const maxQty =
                          stockRestanteParaProducto(
                            item.producto,
                            items,
                            catalogType,
                            key,
                          ) + item.cantidad
                        const atMax = item.cantidad >= maxQty
                        return (
                          <MobileCartItem
                            key={key}
                            item={item}
                            catalogType={catalogType}
                            onDecrease={() =>
                              actualizarCantidad(key, item.cantidad - 1, catalogType)
                            }
                            onIncrease={() => {
                              const result = actualizarCantidad(
                                key,
                                item.cantidad + 1,
                                catalogType,
                              )
                              if (!result.ok) toast.error(result.message)
                            }}
                            onRemove={() => quitar(key)}
                            maxCantidad={maxQty}
                            stockHint={
                              atMax
                                ? mensajeStockRestante(
                                    stockRestanteParaProducto(
                                      item.producto,
                                      items,
                                      catalogType,
                                    ),
                                  )
                                : null
                            }
                          />
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]">
                    <EntregaPicker
                      compact
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
                  </div>

                  <MobileCartSummary
                    items={items}
                    subtotal={subtotal}
                    catalogType={catalogType}
                    envio={costoEnvio}
                    total={esRecogida ? totalFinal : undefined}
                    tiempoEntrega={esRecogida ? tiempoEntrega : undefined}
                    envioGratis={envioGratis}
                    showEnvio={esRecogida}
                    esRecogida={esRecogida}
                    compact
                  />
                  {catalogType === 'mayoreo' && (
                    <div className="rounded-xl border border-[rgba(169,137,224,0.4)] bg-[rgba(169,137,224,0.08)] p-4 md:rounded-xl">
                      <p className="text-[13px] font-medium text-[var(--accent-deep)]">
                        Pedido mínimo: {formatPrecio(minimoMayoreo)}
                      </p>
                      {recompraSugerida > 0 ? (
                        <p className="mt-1 text-[11px] font-light text-[var(--text-muted)]">
                          Pedidos posteriores: mínimo sugerido{' '}
                          {formatPrecio(recompraSugerida)}
                        </p>
                      ) : null}
                      {!cumpleMinimo ? (
                        <p className="mt-2 text-[12px] font-light leading-relaxed text-[var(--text-secondary)]">
                          {mensajeMinimoMayoreo}
                        </p>
                      ) : null}
                    </div>
                  )}
                  <p className="text-center text-[11px] font-light leading-relaxed text-[var(--text-subtle)]">
                    {esRecogida
                      ? datos.sucursalRecogida
                        ? 'Recoges en tienda · sin costo de envío 💕'
                        : 'Elige la tienda donde quieres recoger ✨'
                      : 'El envío se calcula según tu ciudad 💕'}
                  </p>
                  <Link
                    href={productosHref}
                    className="mt-1 block py-2 text-center text-[11px] font-medium text-[var(--text-muted)] active:text-[var(--accent-primary)]"
                  >
                    ← Seguir explorando 💕
                  </Link>
                </div>

                <div className={stickySpacer} aria-hidden />

                <MobileCartStickyBar
                  totalLabel="Subtotal"
                  totalValue={formatPrecio(subtotal)}
                  primaryLabel="Continuar ✨"
                  onPrimary={handleContinuar}
                  primaryDisabled={catalogType === 'mayoreo' && !cumpleMinimo}
                  hint={
                    catalogType === 'mayoreo' && !cumpleMinimo
                      ? `Faltan ${formatPrecio(faltaParaMinimo)} para el mínimo`
                      : `${items.length} tesoro${items.length !== 1 ? 's' : ''} en tu bolsita`
                  }
                />
              </>
            )}
          </motion.div>
        )}

        {step === 'datos' && (
          <motion.div
            key="datos"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 pb-1"
          >
            <div className="mobile-cart-list-panel">
              <div className="mobile-cart-list-panel__header">
                <div>
                  <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                    {esRecogida ? 'Contacto' : 'Contacto y entrega'}
                  </p>
                  <p className="mt-1 text-[12px] font-light text-[var(--text-muted)]">
                    {esRecogida
                      ? 'Solo necesitamos tus datos para avisar'
                      : 'Para coordinar tu pedido'}
                  </p>
                </div>
              </div>

              <div className="mobile-cart-checkout-fields">
                <CartFormField id="cart-nombre" label="Nombre completo" required error={errores.nombre}>
                  <input
                    id="cart-nombre"
                    type="text"
                    value={datos.nombre}
                    onChange={e => {
                      setDatos(d => ({ ...d, nombre: e.target.value }))
                      if (errores.nombre) setErrores(er => ({ ...er, nombre: '' }))
                    }}
                    placeholder="Ej: María López"
                    className={checkoutInputClass}
                    autoComplete="name"
                  />
                </CartFormField>

                <CartFormField id="cart-celular" label="Celular" required error={errores.celular}>
                  <input
                    id="cart-celular"
                    type="tel"
                    inputMode="tel"
                    value={datos.celular}
                    onChange={e => {
                      setDatos(d => ({ ...d, celular: e.target.value }))
                      if (errores.celular) setErrores(er => ({ ...er, celular: '' }))
                    }}
                    placeholder="Ej: 3001234567"
                    className={checkoutInputClass}
                    autoComplete="tel"
                  />
                </CartFormField>

                {esRecogida ? (
                  <div className="mx-4 mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Store size={15} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[var(--accent-deep)]">
                          Recoges en tienda
                        </p>
                        <p className="mt-1 text-[12px] font-medium leading-relaxed text-[var(--text-primary)]">
                          {datos.sucursalRecogida}
                        </p>
                        <button
                          type="button"
                          onClick={() => setStep('carrito')}
                          className="mt-2 text-[11px] font-bold text-[var(--accent-deep)]"
                        >
                          Cambiar tienda
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <CartFormField id="cart-ciudad" label="Ciudad" required error={errores.ciudad}>
                      <input
                        id="cart-ciudad"
                        type="text"
                        value={datos.ciudad}
                        onChange={e => {
                          setDatos(d => ({ ...d, ciudad: e.target.value }))
                          if (errores.ciudad) setErrores(er => ({ ...er, ciudad: '' }))
                        }}
                        placeholder="Ej: Armenia, Bogotá..."
                        className={checkoutInputClass}
                        autoComplete="address-level2"
                      />
                    </CartFormField>

                    {datos.ciudad.trim() ? (
                      <div className="mobile-cart-checkout-shipping">
                        <p className="flex items-start gap-2">
                          <Truck size={14} className="mt-0.5 shrink-0 text-[var(--accent-deep)]" />
                          <span>
                            {envioGratis
                              ? 'Envío gratis para tu pedido'
                              : costoEnvio === 0
                                ? 'Envío a convenir con el negocio'
                                : `Envío: ${formatPrecio(costoEnvio)} — ${tiempoEntrega}`}
                          </span>
                        </p>
                      </div>
                    ) : null}

                    <CartFormField id="cart-direccion" label="Dirección" required error={errores.direccion}>
                      <input
                        id="cart-direccion"
                        type="text"
                        value={datos.direccion}
                        onChange={e => {
                          setDatos(d => ({ ...d, direccion: e.target.value }))
                          if (errores.direccion) setErrores(er => ({ ...er, direccion: '' }))
                        }}
                        placeholder="Calle, barrio, referencias..."
                        className={checkoutInputClass}
                        autoComplete="street-address"
                      />
                    </CartFormField>
                  </>
                )}
              </div>
            </div>

            <div className="mobile-cart-list-panel">
              <div className="mobile-cart-list-panel__header">
                <div>
                  <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                    Forma de pago
                  </p>
                  <p className="mt-1 text-[12px] font-light text-[var(--text-muted)]">
                    {PAGOS_COPY.checkoutIntro}
                  </p>
                </div>
              </div>

              <MetodoPagoPicker
                compact
                metodos={metodosPago}
                selected={datos.metodoPago}
                error={errores.metodoPago}
                onSelect={label => {
                  setDatos(d => ({ ...d, metodoPago: label }))
                  if (errores.metodoPago) setErrores(er => ({ ...er, metodoPago: '' }))
                  if (!esMetodoTransferencia(label)) onComprobanteChange(null)
                }}
              />
              {esTransferencia && transferencia.activo ? (
                <div className="px-3 pb-3">
                  <TransferenciaCheckout
                    compact
                    datos={transferencia}
                    totalLabel={formatPrecio(totalFinal)}
                    comprobante={comprobantePago}
                    onComprobanteChange={onComprobanteChange}
                  />
                </div>
              ) : null}

              <div className="mobile-cart-checkout-notes">
                <label htmlFor="cart-notas" className="mobile-cart-checkout-notes__label">
                  Notas para la entrega <span>(opcional)</span>
                </label>
                <textarea
                  id="cart-notas"
                  value={datos.notas}
                  onChange={e => setDatos(d => ({ ...d, notas: e.target.value }))}
                  placeholder="Ej: dejar en portería, timbre no funciona..."
                  rows={2}
                />
              </div>
            </div>

            <div className={stickySpacer} aria-hidden />

            <MobileCartStickyBar
              totalLabel="Subtotal"
              totalValue={formatPrecio(subtotal)}
              primaryLabel="Revisar pedido ✨"
              onPrimary={handleConfirmar}
              secondaryLabel="Volver"
              onSecondary={() => setStep('carrito')}
              layout="stack"
            />
          </motion.div>
        )}

        {step === 'resumen' && (
          <motion.div
            key="resumen"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="mobile-cart-whatsapp-banner flex items-center gap-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-muted)] p-4 shadow-[var(--shadow-soft)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--accent-primary)]" aria-hidden>
                {catalogType === 'mayoreo' ? <WhatsAppIcon size={20} /> : <Sparkles size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[var(--accent-deep)]">
                  {catalogType === 'mayoreo' ? 'Listo para WhatsApp' : 'Último pasito ✨'}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                  {catalogType === 'mayoreo'
                    ? 'Confirma y te llevamos al chat con tu pedido armado.'
                    : 'Confirmamos por WhatsApp · ePayco, Addi y más llegan pronto a la web'}
                </p>
              </div>
            </div>

            <div className="mobile-cart-review-panel overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
              <div className="mobile-cart-review-panel__header">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="mobile-cart-review-panel__icon" aria-hidden>
                    <Package size={15} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                      Tu pedido
                    </p>
                    <p className="mt-0.5 text-[11px] font-light text-[var(--text-muted)]">
                      Revisa los artículos antes de enviar
                    </p>
                  </div>
                </div>
                <span className="mobile-cart-review-panel__count shrink-0">
                  {items.length}
                </span>
              </div>

              <div className="mobile-cart-review-list">
                {items.map(item => (
                  <MobileCartReviewItem
                    key={itemLineKey(item)}
                    item={item}
                    catalogType={catalogType}
                  />
                ))}
              </div>
            </div>

            <div className="mobile-cart-data-panel rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
              <div className="mobile-cart-data-panel__header">
                <span className="mobile-cart-review-panel__icon" aria-hidden>
                  <User size={15} strokeWidth={1.75} />
                </span>
                <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                  {esRecogida ? 'Tus datos' : 'Datos de entrega'}
                </p>
              </div>
              <dl className="mobile-cart-data-list">
                {[
                  { label: 'Nombre', value: datos.nombre, icon: User },
                  { label: 'Celular', value: datos.celular, icon: Phone },
                  ...(esRecogida
                    ? [{ label: 'Recoger en', value: datos.sucursalRecogida, icon: Store }]
                    : [
                        { label: 'Ciudad', value: datos.ciudad, icon: MapPin },
                        { label: 'Dirección', value: datos.direccion, icon: Truck },
                      ]),
                  { label: 'Pago', value: datos.metodoPago, icon: CreditCard },
                  ...(esTransferencia && comprobantePago
                    ? [{ label: 'Comprobante', value: comprobantePago.name, icon: Paperclip }]
                    : []),
                  ...(datos.notas ? [{ label: 'Notas', value: datos.notas, icon: FileText }] : []),
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="mobile-cart-data-row">
                    <span className="mobile-cart-data-row__icon" aria-hidden>
                      <Icon size={13} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <dt>{label}</dt>
                      <dd className="truncate" title={value.length > 42 ? value : undefined}>
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <MobileCartSummary
              items={items}
              subtotal={subtotal}
              catalogType={catalogType}
              envio={costoEnvio}
              total={totalFinal}
              tiempoEntrega={tiempoEntrega}
              envioGratis={envioGratis}
              showEnvio
              esRecogida={esRecogida}
              recargoLabel={recargoLabel}
              recargoMonto={recargoMonto}
              compact
            />

            <p className="text-center text-[11px] leading-relaxed text-[var(--text-subtle)]">
              {catalogType === 'mayoreo' && !cumpleMinimo
                ? mensajeMinimoMayoreo
                : catalogType === 'mayoreo'
                  ? 'Al confirmar se abrirá WhatsApp con tu pedido listo.'
                  : PAGOS_COPY.resumenHint}
            </p>

            <div className={stickySpacer} aria-hidden />

            <MobileCartStickyBar
              totalLabel="Total a pagar"
              totalValue={formatPrecio(totalFinal)}
              primaryLabel={
                catalogType === 'mayoreo' ? 'Enviar por WhatsApp' : 'Confirmar pedido ✨'
              }
              onPrimary={handleEnviarWhatsApp}
              primaryDisabled={
                enviando || (catalogType === 'mayoreo' && !cumpleMinimo)
              }
              primaryLoading={enviando}
              primaryIcon={
                !enviando
                  ? catalogType === 'mayoreo'
                    ? <WhatsAppIcon size={18} />
                    : <Sparkles size={18} />
                  : undefined
              }
              variant={catalogType === 'mayoreo' ? 'whatsapp' : 'gold'}
              layout="stack"
              secondaryLabel="Volver a datos"
              onSecondary={() => setStep('datos')}
            />
          </motion.div>
        )}

        {step === 'exito' && (
          <motion.div
            key="exito"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="pb-[env(safe-area-inset-bottom,0px)]"
          >
            <CartCheckoutSuccess
              compact
              productosHref={productosHref}
              whatsappHref={whatsappHref}
              onReabrirWhatsApp={handleReabrirWhatsApp}
              onVolverResumen={() => setStep('resumen')}
              onConfirmarEnviado={handleConfirmarPedidoEnviado}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
