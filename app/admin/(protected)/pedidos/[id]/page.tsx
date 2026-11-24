'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Paperclip,
  Phone,
  Receipt,
  Store,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrecio } from '@/lib/catalog'
import {
  ORDER_FLOW,
  ORDER_STATUS,
  documentShort,
  orderCode,
  type OrderStatus,
} from '@/lib/orders/shared'
import {
  customerWhatsAppDigits,
  customerWhatsAppTemplates,
  formatMoney,
  formatOrderDate,
  whatsAppLink,
  type OrderHistoryRow,
  type OrderItemRow,
  type OrderRow,
} from '@/lib/orders/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/orders/OrderBadges'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AdminLoadError from '@/components/admin/AdminLoadError'

type Busy = null | 'status' | 'payment' | 'shipping' | 'notes' | 'cancel'

function Card({ title, icon: Icon, children, action }: { title: string; icon: typeof User; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-soft)] sm:rounded-[20px] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--text-primary)]">
          <Icon size={16} className="text-[var(--accent-primary)]" aria-hidden />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <dt className="shrink-0 font-semibold text-[var(--text-muted)]">{label}</dt>
      <dd className="min-w-0 text-right font-bold text-[var(--text-primary)] [overflow-wrap:anywhere]">{value}</dd>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:bg-white'

export default function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [items, setItems] = useState<OrderItemRow[]>([])
  const [history, setHistory] = useState<OrderHistoryRow[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading')
  const [busy, setBusy] = useState<Busy>(null)
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = useCallback(async () => {
    const [o, it, h] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase.from('order_status_history').select('id, from_status, to_status, created_at').eq('order_id', id).order('created_at', { ascending: true }),
    ])
    if (o.error || it.error || h.error) {
      console.error('[admin/pedido]', o.error || it.error || h.error)
      setState('error')
      return
    }
    if (!o.data) {
      setState('missing')
      return
    }
    const row = o.data as OrderRow
    setOrder(row)
    setItems((it.data ?? []) as OrderItemRow[])
    setHistory((h.data ?? []) as OrderHistoryRow[])
    setCarrier(row.carrier ?? '')
    setTracking(row.tracking_number ?? '')
    setNotes(row.internal_notes ?? '')
    setState('ready')
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const update = async (patch: Partial<Pick<OrderRow, 'status' | 'payment_status' | 'carrier' | 'tracking_number' | 'internal_notes'>>, what: Busy, ok: string) => {
    if (!order || busy) return
    setBusy(what)
    const { error } = await supabase.from('orders').update(patch).eq('id', order.id)
    if (error) {
      console.error('[admin/pedido] update', error)
      toast.error(error.message.includes('wompi_payment_locked') ? 'El pago de Wompi se confirma solo, desde Wompi.' : 'No se pudo guardar. Intenta de nuevo.')
    } else {
      toast.success(ok)
      await load()
    }
    setBusy(null)
  }

  const wa = customerWhatsAppDigits(order?.customer_phone)
  const templates = useMemo(() => (order ? customerWhatsAppTemplates(order) : []), [order])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-4 py-5 sm:p-8 lg:p-10" aria-busy="true">
        <span role="status" className="sr-only">Cargando pedido…</span>
        <div className="mb-6 h-10 w-56 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {[220, 180].map(h => <div key={h} style={{ height: h }} className="animate-pulse rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)]" />)}
          </div>
          <div className="space-y-4">
            {[160, 200, 140].map(h => <div key={h} style={{ height: h }} className="animate-pulse rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)]" />)}
          </div>
        </div>
      </div>
    )
  }
  if (state === 'error') {
    return <div className="p-6"><AdminLoadError onRetry={() => { setState('loading'); void load() }} /></div>
  }
  if (state === 'missing' || !order) {
    return (
      <div className="p-8 text-center">
        <p className="text-[15px] font-bold text-[var(--text-primary)]">Este pedido no existe o fue eliminado.</p>
        <Link href="/admin/pedidos" className="mt-3 inline-block text-[13px] font-bold text-[var(--accent-deep)]">← Volver a pedidos</Link>
      </div>
    )
  }

  const code = orderCode(order.order_number)
  const cancelled = order.status === 'cancelled'
  const flowIndex = ORDER_FLOW.indexOf(order.status === 'awaiting_payment' ? 'pending' : order.status)
  const nextStatus: OrderStatus | null = !cancelled && flowIndex >= 0 && flowIndex < ORDER_FLOW.length - 1 ? ORDER_FLOW[flowIndex + 1] : null
  const canConfirmPayment = order.payment_kind !== 'wompi' && order.payment_status !== 'approved' && !cancelled
  const anonymized = Boolean(order.anonymized_at)

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-3.5 py-4 sm:p-8 lg:p-10">
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-deep)]">
        <ArrowLeft size={14} /> Pedidos
      </Link>

      <header className="mb-5 flex flex-col gap-2 border-b border-[rgba(169,137,224,0.16)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--text-primary)] sm:text-[26px]">{code}</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {formatOrderDate(order.created_at)} · Catálogo {order.catalog === 'mayoreo' ? 'mayorista' : 'detal'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
            {order.wants_invoice ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(169,137,224,0.4)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-deep)]">Pide factura electrónica</span>
            ) : null}
          </div>
        </div>
        <p className="text-[22px] font-extrabold text-[var(--text-primary)] sm:text-[28px]">{formatPrecio(Number(order.total))}</p>
      </header>

      {/* Progress */}
      {!cancelled ? (
        <ol className="mb-6 grid grid-cols-5 gap-1.5" aria-label="Progreso del pedido">
          {ORDER_FLOW.map((s, i) => {
            const done = i <= flowIndex
            return (
              <li key={s} className="min-w-0">
                <div className={`h-1.5 rounded-full ${done ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'}`} />
                <p className={`mt-1.5 truncate text-[10px] font-bold sm:text-[11px] ${done ? 'text-[var(--accent-deep)]' : 'text-[var(--text-faint)]'}`}>
                  {ORDER_STATUS[s].label}
                </p>
              </li>
            )
          })}
        </ol>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <Card title={`Productos (${items.reduce((a, i) => a + i.quantity, 0)} unidades)`} icon={Package}>
            <ul className="divide-y divide-[var(--border)]">
              {items.map(item => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--text-primary)]">
                      {item.product_name}
                    </p>
                    {item.variations ? (
                      <p className="mt-0.5 text-[12px] font-semibold text-[var(--accent-deep)]">
                        {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {item.product_sku ? `Ref. ${item.product_sku} · ` : ''}
                      {item.quantity} × {item.unit_price == null ? 'precio por confirmar' : formatPrecio(Number(item.unit_price))}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-extrabold text-[var(--text-primary)]">
                    {item.line_total == null ? '—' : formatPrecio(Number(item.line_total))}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 border-t border-[var(--border)] pt-2">
              <Row label="Subtotal" value={formatPrecio(Number(order.subtotal))} />
              <Row label={`Envío${order.shipping_label ? ` · ${order.shipping_label}` : ''}`} value={order.delivery_type === 'recogida' ? 'No aplica' : formatMoney(order.shipping_cost)} />
              {order.surcharge > 0 ? <Row label={order.surcharge_label || 'Recargo'} value={`+${formatPrecio(Number(order.surcharge))}`} /> : null}
              <Row label="Total" value={<span className="text-[16px]">{formatPrecio(Number(order.total))}</span>} />
              {order.has_unpriced_items ? <p className="mt-1 text-[12px] font-bold text-[#A8487E]">Hay productos con precio por confirmar (no están sumados).</p> : null}
            </dl>
          </Card>

          <Card title="Cliente" icon={User} action={wa ? (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[12px] font-bold text-white">
              <MessageCircle size={13} /> WhatsApp
            </a>
          ) : null}>
            {anonymized ? (
              <p className="text-[13px] text-[var(--text-muted)]">Los datos personales de este pedido se eliminaron en la limpieza de historial.</p>
            ) : (
              <dl>
                <Row label="Nombre" value={order.customer_name} />
                <Row label="Celular" value={<a href={`tel:${order.customer_phone}`} className="inline-flex items-center gap-1"><Phone size={12} />{order.customer_phone}</a>} />
                <Row label="Documento" value={`${documentShort(order.document_type)} ${order.document_number ?? ''}`} />
                {order.delivery_type === 'recogida' ? (
                  <Row label="Entrega" value={<span className="inline-flex items-center gap-1"><Store size={12} /> Recoge en: {order.pickup_branch}</span>} />
                ) : (
                  <>
                    <Row label="Ciudad" value={order.city} />
                    <Row label="Dirección" value={<span className="inline-flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0" />{order.address}</span>} />
                  </>
                )}
                {order.notes ? <Row label="Notas del cliente" value={order.notes} /> : null}
              </dl>
            )}
          </Card>

          {order.wants_invoice && !anonymized ? (
            <Card title="Factura electrónica" icon={FileText}>
              <dl>
                <Row label="Enviar a" value={order.invoice_email} />
                <Row label="A nombre de" value={order.invoice_name || order.customer_name} />
                <Row
                  label="Documento"
                  value={order.invoice_document_number
                    ? `${documentShort(order.invoice_document_type)} ${order.invoice_document_number}`
                    : `${documentShort(order.document_type)} ${order.document_number ?? ''}`}
                />
              </dl>
            </Card>
          ) : null}

          <Card title="Historial" icon={Receipt}>
            <ol className="space-y-2">
              {history.map(h => (
                <li key={h.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="font-bold text-[var(--text-primary)]">{ORDER_STATUS[h.to_status]?.label ?? h.to_status}</span>
                  <span className="text-[var(--text-muted)]">{formatOrderDate(h.created_at)}</span>
                </li>
              ))}
            </ol>
            {order.privacy_accepted_at ? (
              <p className="mt-3 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--text-muted)]">
                Aceptó términos y política de datos (versión {order.privacy_version}) el {formatOrderDate(order.privacy_accepted_at)}.
              </p>
            ) : null}
          </Card>
        </div>

        <aside className="min-w-0 space-y-3 sm:space-y-4">
          <Card title="Estado del pedido" icon={Check}>
            {cancelled ? (
              <p className="text-[13px] font-semibold text-[#B83F55]">Pedido cancelado {order.cancelled_at ? `el ${formatOrderDate(order.cancelled_at)}` : ''}.</p>
            ) : (
              <div className="space-y-2">
                {nextStatus ? (
                  <Button
                    fullWidth
                    loading={busy === 'status'}
                    disabled={busy !== null}
                    onClick={() => void update({ status: nextStatus }, 'status', `Pedido marcado como “${ORDER_STATUS[nextStatus].label}”`)}
                  >
                    Marcar como {ORDER_STATUS[nextStatus].label.toLowerCase()}
                  </Button>
                ) : (
                  <p className="text-[13px] font-semibold text-[#2E7D5B]">Pedido entregado ✨</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Cambiar a otro estado">
                  {ORDER_FLOW.filter(s => s !== order.status && s !== nextStatus).map(s => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void update({ status: s }, 'status', `Estado cambiado a “${ORDER_STATUS[s].label}”`)}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)] disabled:opacity-50"
                    >
                      {ORDER_STATUS[s].label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setConfirmCancel(true)}
                  className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#B83F55] disabled:opacity-50"
                >
                  <XCircle size={13} /> Cancelar pedido
                </button>
              </div>
            )}
          </Card>

          <Card title="Pago" icon={CircleDollarSign}>
            <dl>
              <Row label="Método" value={order.payment_method} />
              <Row label="Estado" value={<PaymentStatusBadge status={order.payment_status} />} />
              {order.paid_at ? <Row label="Confirmado" value={formatOrderDate(order.paid_at)} /> : null}
              {order.wompi_transaction_id ? <Row label="Transacción Wompi" value={order.wompi_transaction_id} /> : null}
            </dl>
            {order.receipt_path ? (
              <a
                href={`/admin/comprobantes/${order.receipt_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] font-bold text-[var(--accent-deep)]"
              >
                <Paperclip size={13} /> Ver comprobante <ExternalLink size={11} />
              </a>
            ) : null}
            {canConfirmPayment ? (
              <div className="mt-3">
                <Button
                  fullWidth
                  variant="outline"
                  loading={busy === 'payment'}
                  disabled={busy !== null}
                  onClick={() => void update({ payment_status: 'approved' }, 'payment', 'Pago confirmado')}
                >
                  Confirmar que el pago llegó
                </Button>
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">Revisa primero tu cuenta o el comprobante.</p>
              </div>
            ) : null}
            {order.payment_kind === 'wompi' && order.payment_status !== 'approved' ? (
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">Los pagos con Wompi se confirman solos cuando Wompi los aprueba.</p>
            ) : null}
          </Card>

          {order.delivery_type === 'envio' && !cancelled ? (
            <Card title="Envío" icon={Truck}>
              <div className="space-y-2.5">
                <label className="block text-[12px] font-bold text-[var(--text-muted)]">
                  Transportadora
                  <input className={`${inputCls} mt-1`} value={carrier} maxLength={80} onChange={e => setCarrier(e.target.value)} placeholder="Ej: Envia, Coordinadora, Interrapidísimo" />
                </label>
                <label className="block text-[12px] font-bold text-[var(--text-muted)]">
                  Número de guía
                  <input className={`${inputCls} mt-1`} value={tracking} maxLength={80} onChange={e => setTracking(e.target.value)} placeholder="Ej: 014012345678" />
                </label>
                <Button
                  fullWidth
                  variant="outline"
                  loading={busy === 'shipping'}
                  disabled={busy !== null || (carrier === (order.carrier ?? '') && tracking === (order.tracking_number ?? ''))}
                  onClick={() => void update({ carrier: carrier.trim() || null, tracking_number: tracking.trim() || null }, 'shipping', 'Datos de envío guardados')}
                >
                  Guardar envío
                </Button>
              </div>
            </Card>
          ) : null}

          {wa && !anonymized ? (
            <Card title="Escribirle al cliente" icon={MessageCircle}>
              <p className="mb-2 text-[12px] text-[var(--text-muted)]">Abre WhatsApp con un mensaje listo (lo puedes editar antes de enviar).</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <a
                    key={t.id}
                    href={whatsAppLink(wa, t.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-center text-[12px] font-bold text-[var(--text-secondary)] hover:border-[#25D366] hover:text-[#128C7E]"
                  >
                    {t.label}
                  </a>
                ))}
              </div>
            </Card>
          ) : null}

          <Card title="Notas internas" icon={FileText}>
            <textarea
              className={`${inputCls} min-h-[90px] resize-y`}
              value={notes}
              maxLength={2000}
              onChange={e => setNotes(e.target.value)}
              placeholder="Solo las ve el admin. Ej: cliente pidió empaque de regalo."
            />
            <div className="mt-2">
              <Button
                fullWidth
                variant="outline"
                loading={busy === 'notes'}
                disabled={busy !== null || notes === (order.internal_notes ?? '')}
                onClick={() => void update({ internal_notes: notes.trim() || null }, 'notes', 'Notas guardadas')}
              >
                Guardar notas
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title={`Cancelar ${code}`} size="sm">
        <div className="space-y-5">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            El pedido quedará como cancelado (no se borra). Si el cliente ya pagó, recuerda hacerle la devolución.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setConfirmCancel(false)} disabled={busy !== null}>
              Volver
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={busy === 'cancel'}
              onClick={async () => {
                await update({ status: 'cancelled' }, 'cancel', 'Pedido cancelado')
                setConfirmCancel(false)
              }}
            >
              Cancelar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
