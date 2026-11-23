/** Admin-side order helpers (browser): row types, formatting, WhatsApp templates. */
import { formatPrecio } from '@/lib/catalog'
import { orderCode, type OrderStatus, type PaymentStatus } from '@/lib/orders/shared'

export type OrderRow = {
  id: string
  order_number: number
  catalog: 'detal' | 'mayoreo'
  status: OrderStatus
  payment_method: string
  payment_kind: 'wompi' | 'transfer' | 'other'
  payment_status: PaymentStatus
  payment_reference: string | null
  wompi_transaction_id: string | null
  receipt_path: string | null
  customer_name: string | null
  customer_phone: string | null
  document_type: string | null
  document_number: string | null
  delivery_type: 'envio' | 'recogida'
  city: string | null
  city_code: string | null
  address: string | null
  pickup_branch: string | null
  notes: string | null
  wants_invoice: boolean
  invoice_email: string | null
  invoice_name: string | null
  invoice_document_type: string | null
  invoice_document_number: string | null
  shipping_label: string | null
  shipping_cost: number | null
  surcharge_label: string | null
  surcharge: number
  subtotal: number
  total: number
  has_unpriced_items: boolean
  carrier: string | null
  tracking_number: string | null
  internal_notes: string | null
  privacy_version: string | null
  privacy_accepted_at: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
}

export type OrderItemRow = {
  id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  variations: Record<string, string> | null
  unit_price: number | null
  unit_price_before: number | null
  quantity: number
  line_total: number | null
}

export type OrderHistoryRow = {
  id: number
  from_status: string | null
  to_status: OrderStatus
  created_at: string
}

export const ORDER_LIST_COLUMNS =
  'id, order_number, catalog, status, payment_method, payment_kind, payment_status, customer_name, customer_phone, document_number, delivery_type, city, pickup_branch, total, has_unpriced_items, wants_invoice, tracking_number, created_at'

export function formatOrderDate(iso: string, withTime = true): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(iso))
}

export function formatMoney(value: number | null | undefined): string {
  return value == null ? 'A convenir' : formatPrecio(Number(value))
}

/** 3001234567 → 573001234567 (wa.me needs the country code). */
export function customerWhatsAppDigits(phone: string | null | undefined): string | null {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

export type WhatsAppTemplate = { id: string; label: string; text: string }

/** Ready-made messages from the store to the customer, per situation. */
export function customerWhatsAppTemplates(order: Pick<OrderRow,
  'order_number' | 'customer_name' | 'total' | 'carrier' | 'tracking_number' | 'delivery_type' | 'pickup_branch' | 'has_unpriced_items'>): WhatsAppTemplate[] {
  const code = orderCode(order.order_number)
  const firstName = (order.customer_name || '').trim().split(/\s+/)[0] || ''
  const hola = `Hola${firstName ? ` ${firstName}` : ''} 💜 Te escribimos de Lila Store.`
  const total = order.has_unpriced_items ? '' : ` por ${formatPrecio(Number(order.total))}`
  const guia = [
    order.carrier ? `Transportadora: ${order.carrier}` : '',
    order.tracking_number ? `Número de guía: ${order.tracking_number}` : '',
  ].filter(Boolean).join('\n')

  return [
    {
      id: 'received',
      label: 'Pedido recibido',
      text: `${hola}\nRecibimos tu pedido ${code}${total} ✨ En un momento te confirmamos los detalles.`,
    },
    {
      id: 'paid',
      label: 'Pago confirmado',
      text: `${hola}\nConfirmamos el pago de tu pedido ${code} ✅ Ya lo estamos preparando con mucho cariño.`,
    },
    order.delivery_type === 'recogida'
      ? {
          id: 'ready',
          label: 'Listo para recoger',
          text: `${hola}\nTu pedido ${code} ya está listo para recoger 🛍️${order.pickup_branch ? `\n📍 ${order.pickup_branch}` : ''}`,
        }
      : {
          id: 'shipped',
          label: 'Pedido enviado',
          text: `${hola}\nTu pedido ${code} ya va en camino 🚚${guia ? `\n${guia}` : ''}`,
        },
    {
      id: 'delivered',
      label: 'Pedido entregado',
      text: `${hola}\n¿Ya recibiste tu pedido ${code}? Esperamos que te encante 💜 Cualquier cosa, aquí estamos.`,
    },
    {
      id: 'cancelled',
      label: 'Pedido cancelado',
      text: `${hola}\nTu pedido ${code} fue cancelado. Si tienes alguna duda, escríbenos por aquí.`,
    },
    {
      id: 'free',
      label: 'Mensaje libre',
      text: `${hola}\nTe escribimos sobre tu pedido ${code}.`,
    },
  ]
}

export function whatsAppLink(digits: string, text: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
