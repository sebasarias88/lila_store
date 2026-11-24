'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { useCarrito } from '@/lib/store'
import { clearPendingPayment, loadPendingPayment } from '@/lib/payments/pendingOrder'
import { abrirWhatsApp, buildWhatsAppPedidoHref, generarMensajeWhatsApp } from '@/lib/whatsapp'
import { resolveWhatsAppPedidoNumero } from '@/lib/negocio'

export type PaymentResultState = 'approved' | 'declined' | 'pending' | 'unknown'

const COPY: Record<PaymentResultState, { title: string; text: string }> = {
  approved: {
    title: '¡Pago aprobado! 💜',
    text: 'Recibimos tu pago. Envíanos el resumen por WhatsApp y empezamos a preparar tu pedido.',
  },
  pending: {
    title: 'Tu pago está en proceso',
    text: 'Algunos medios (PSE, Nequi) tardan unos minutos en confirmar. Actualiza en un momento.',
  },
  declined: {
    title: 'El pago no se completó',
    text: 'No se hizo ningún cobro. Puedes intentarlo de nuevo o elegir otro medio de pago.',
  },
  unknown: {
    title: 'No encontramos el pago',
    text: 'Si pagaste y ves este mensaje, escríbenos por WhatsApp con tu número de pedido.',
  },
}

export default function PaymentResult({
  state,
  orderCode,
  orderId,
}: {
  state: PaymentResultState
  orderCode: string | null
  orderId: string | null
}) {
  const router = useRouter()
  const vaciar = useCarrito(s => s.vaciar)
  const [retrying, setRetrying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  // Approved: build the WhatsApp summary from what the checkout saved, then empty the cart.
  useEffect(() => {
    if (state !== 'approved') return
    const pending = loadPendingPayment()
    if (pending && pending.order.code === orderCode) {
      setMensaje(
        generarMensajeWhatsApp(
          pending.items,
          pending.datos,
          pending.order.shippingCost ?? 0,
          pending.tiempoEntrega,
          pending.catalog,
          null,
          null,
          { ...pending.order, paidOnline: true },
        ),
      )
    } else if (orderCode) {
      setMensaje(encodeURIComponent(`Hola 💜 Acabo de pagar en línea mi pedido ${orderCode} en Lila Store.`))
    }
    vaciar()
    clearPendingPayment()
  }, [state, orderCode, vaciar])

  const waHref = useMemo(
    () => (mensaje ? buildWhatsAppPedidoHref(mensaje, resolveWhatsAppPedidoNumero()) : null),
    [mensaje],
  )

  const retry = async () => {
    if (!orderId || retrying) return
    setRetrying(true)
    try {
      const res = await fetch('/api/payments/wompi/retry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; checkoutUrl?: string; message?: string } | null
      if (data?.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }
      toast.error(data?.message || 'No pudimos reintentar el pago.')
    } catch {
      toast.error('Sin conexión. Intenta de nuevo.')
    }
    setRetrying(false)
  }

  const Icon = state === 'approved' ? CheckCircle2 : state === 'pending' ? Clock : XCircle
  const iconTone =
    state === 'approved'
      ? 'bg-[var(--accent-primary)] text-white'
      : state === 'pending'
        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
        : 'bg-[rgba(232,121,138,0.14)] text-[#B83F55]'

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[#F9F6FF] to-[#F8EAF4] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-10">
      <span className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconTone}`}>
        <Icon size={30} strokeWidth={2} />
      </span>
      {orderCode ? (
        <p className="mx-auto mb-3 inline-block rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-[13px] font-bold text-[var(--accent-deep)]">
          Pedido {orderCode}
        </p>
      ) : null}
      <h1 className="text-[1.4rem] font-bold text-[var(--text-primary)]">{COPY[state].title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
        {COPY[state].text}
      </p>

      <div className="mx-auto mt-7 flex max-w-xs flex-col gap-3">
        {state === 'approved' && waHref ? (
          <button
            type="button"
            onClick={() => mensaje && abrirWhatsApp(mensaje, resolveWhatsAppPedidoNumero())}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[14px] font-bold text-white"
          >
            Enviar resumen por WhatsApp
          </button>
        ) : null}

        {state === 'declined' && orderId ? (
          <button
            type="button"
            onClick={() => void retry()}
            disabled={retrying}
            className="catalog-gold-cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold disabled:opacity-70"
          >
            {retrying ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            {retrying ? 'Abriendo Wompi…' : 'Intentar pagar de nuevo'}
          </button>
        ) : null}

        {state === 'pending' ? (
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true)
              router.refresh()
              setTimeout(() => setRefreshing(false), 2500)
            }}
            className="catalog-gold-cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold disabled:opacity-70"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Actualizar estado
          </button>
        ) : null}

        {state === 'declined' ? (
          <Link href="/carrito" className="text-[13px] font-bold text-[var(--accent-deep)]">
            Elegir otro medio de pago
          </Link>
        ) : (
          <Link href="/productos" className="text-[13px] font-bold text-[var(--accent-deep)]">
            Seguir comprando
          </Link>
        )}
      </div>
    </div>
  )
}
