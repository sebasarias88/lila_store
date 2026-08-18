'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCarrito } from '@/lib/store'
import {
  cartSubtotal,
  formatVariacionesResumen,
  itemLineKey,
  itemLineTotal,
  variacionesCarritoClassName,
} from '@/lib/cart'
import { catalogPath, getProductoPrecios, type CatalogType } from '@/lib/catalog'
import { X, ShoppingBag, Minus, Plus, Trash2, Sparkles, Heart, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useScrollLock } from '@/lib/useScrollLock'
import {
  mensajeStockRestante,
  stockRestanteParaProducto,
} from '@/lib/stock'
import toast from 'react-hot-toast'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
  catalogType?: CatalogType
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

export default function CartDrawer({
  open,
  onClose,
  catalogType = 'detal',
}: CartDrawerProps) {
  const { items, quitar, actualizarCantidad } = useCarrito()
  const carritoHref = catalogPath(catalogType, '/carrito')
  const productosHref = catalogPath(catalogType, '/productos')
  const subtotal = cartSubtotal(items, catalogType)
  const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0)

  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[rgba(42,34,64,0.38)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md min-h-0 flex-col border-l border-[var(--border)] bg-[var(--bg-base)] shadow-[var(--shadow-dropdown)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Soft top wash */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(169,137,224,0.1)] to-transparent" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--accent-primary)]">
                  <Heart size={17} className="fill-[var(--accent-primary)]" />
                </span>
                <div className="min-w-0">
                  <div className="mb-0.5 inline-flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[var(--accent-primary)]" />
                    <span className="text-[11px] font-bold text-[var(--accent-deep)]">
                      Tu bolsita ✨
                    </span>
                  </div>
                  <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
                    Carrito cute
                  </h2>
                  {items.length > 0 && (
                    <p className="text-[12px] font-medium text-[var(--text-muted)]">
                      {totalUnidades} {totalUnidades === 1 ? 'tesoro' : 'tesoros'} listos
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar carrito"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mx-5 h-px bg-[var(--border)] sm:mx-6" />

            {/* Items */}
            <div
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
              data-lenis-prevent
            >
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EEE8FC] to-[#F8EAF4] text-[var(--accent-primary)] shadow-[var(--shadow-soft)]">
                    <Heart size={28} className="fill-[var(--accent-primary)]" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">
                      Tu bolsita está vacía 💕
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-[var(--text-muted)]">
                      Agrega algo cute y vuelve aquí ✨
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="catalog-gold-cta mt-1 rounded-full px-5 py-2.5 text-[13px] font-bold"
                  >
                    Seguir explorando ✨
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-1">
                    {items.map(item => {
                      const key = itemLineKey(item)
                      const { producto, cantidad, variacionesSeleccionadas } = item
                      const vars = formatVariacionesResumen(variacionesSeleccionadas)
                      const { precio, consultar } = getProductoPrecios(producto, catalogType)
                      const line = itemLineTotal(item, catalogType)
                      const maxQty =
                        stockRestanteParaProducto(producto, items, catalogType, key) +
                        cantidad
                      const atMax = cantidad >= maxQty
                      const restantesLinea = stockRestanteParaProducto(
                        producto,
                        items,
                        catalogType,
                      )

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          layout
                          className="flex gap-3 rounded-[18px] px-2 py-3 transition-colors hover:bg-[var(--bg-muted)]/70"
                        >
                          <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[16px] bg-gradient-to-b from-[#EEE8FC] to-[var(--bg-muted)] ring-1 ring-[var(--border)]">
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
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--text-primary)]">
                                {producto.nombre}
                              </p>
                              <button
                                type="button"
                                onClick={() => quitar(key)}
                                aria-label="Quitar del carrito"
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-subtle)] transition-colors hover:bg-white hover:text-[var(--danger)]"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {vars && (
                              <p className={`mt-1 ${variacionesCarritoClassName}`}>{vars}</p>
                            )}

                            <p className="mt-1.5 text-[14px] font-bold text-[var(--accent-deep)]">
                              {consultar || precio == null
                                ? 'Consultar precio'
                                : formatPrecio(precio)}
                            </p>

                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <div>
                                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-white p-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      actualizarCantidad(key, cantidad - 1, catalogType)
                                    }
                                    aria-label="Disminuir cantidad"
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)]"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="min-w-[1.5rem] text-center text-[12px] font-bold text-[var(--text-primary)]">
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
                                    aria-label="Aumentar cantidad"
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--accent-deep)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                                {atMax ? (
                                  <p className="mt-1 text-[10px] font-medium text-[var(--accent-deep)]">
                                    {mensajeStockRestante(restantesLinea)}
                                  </p>
                                ) : null}
                              </div>

                              <p className="text-[12px] font-bold text-[var(--text-secondary)]">
                                {line != null ? formatPrecio(line) : 'Consultar'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="relative space-y-3.5 border-t border-[var(--border)] bg-gradient-to-t from-[rgba(169,137,224,0.08)] to-transparent px-5 py-5 sm:px-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-[var(--text-muted)]">
                      Subtotal
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                      Envío al finalizar ✨
                    </p>
                  </div>
                  <span className="text-[1.4rem] font-bold leading-none text-[var(--accent-deep)]">
                    {formatPrecio(subtotal)}
                  </span>
                </div>

                {catalogType === 'detal' && (
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                    <CreditCard size={12} className="text-[var(--accent-primary)]" />
                    Tarjeta, PSE, Addi, Sistecrédito o Su+ Pay
                  </p>
                )}

                <Link
                  href={carritoHref}
                  onClick={onClose}
                  className="catalog-gold-cta flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold"
                >
                  <ShoppingBag size={16} />
                  Ir a pagar ✨
                </Link>
                <Link
                  href={productosHref}
                  onClick={onClose}
                  className="block w-full rounded-full py-2 text-center text-[13px] font-bold text-[var(--accent-deep)] transition-colors hover:text-[var(--accent-primary)]"
                >
                  Seguir explorando 💕
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
