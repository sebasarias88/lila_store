/**
 * Order types, labels and validation shared by the browser and the server.
 * No secrets and no server-only code here.
 */
import type { CatalogType } from '@/lib/catalog'

export type DocumentType = 'CC' | 'CE' | 'PP' | 'PEP' | 'NIT'

export const DOCUMENT_TYPES: { id: DocumentType; label: string; short: string }[] = [
  { id: 'CC', label: 'Cédula de ciudadanía', short: 'C.C.' },
  { id: 'CE', label: 'Cédula de extranjería', short: 'C.E.' },
  { id: 'PP', label: 'Pasaporte', short: 'Pasaporte' },
  { id: 'PEP', label: 'Permiso especial (PEP/PPT)', short: 'PEP/PPT' },
]

export const INVOICE_DOCUMENT_TYPES: { id: DocumentType; label: string; short: string }[] = [
  ...DOCUMENT_TYPES,
  { id: 'NIT', label: 'NIT (empresa)', short: 'NIT' },
]

export function documentShort(type: string | null | undefined): string {
  return INVOICE_DOCUMENT_TYPES.find(d => d.id === type)?.short ?? (type || '')
}

/** Returns an error message, or null when the document is valid. */
export function validateDocument(type: string, number: string): string | null {
  const n = number.replace(/[\s.]/g, '')
  if (!n) return 'El número de documento es requerido'
  switch (type) {
    case 'CC':
      return /^\d{5,10}$/.test(n) ? null : 'La cédula debe tener entre 5 y 10 números'
    case 'NIT':
      return /^\d{8,10}(-?\d)?$/.test(n) ? null : 'Escribe el NIT con o sin dígito de verificación (ej: 900123456-7)'
    case 'CE':
    case 'PP':
    case 'PEP':
      return /^[0-9A-Za-z]{4,20}$/.test(n) ? null : 'Documento inválido'
    default:
      return 'Elige el tipo de documento'
  }
}

export function normalizeDocument(number: string): string {
  return number.replace(/[\s.]/g, '').toUpperCase()
}

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'muted' | 'warning' | 'info' | 'success' | 'danger' | 'accent' }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  awaiting_payment: { label: 'Esperando pago', tone: 'warning' },
  paid: { label: 'Pago confirmado', tone: 'info' },
  preparing: { label: 'Preparando', tone: 'accent' },
  shipped: { label: 'Enviado', tone: 'info' },
  delivered: { label: 'Entregado', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pago por confirmar', tone: 'warning' },
  approved: { label: 'Pagado', tone: 'success' },
  declined: { label: 'Pago rechazado', tone: 'danger' },
  voided: { label: 'Pago anulado', tone: 'danger' },
  error: { label: 'Error en el pago', tone: 'danger' },
}

/** Order flow shown in the admin, in order. */
export const ORDER_FLOW: OrderStatus[] = ['pending', 'paid', 'preparing', 'shipped', 'delivered']

export function orderCode(orderNumber: number | string): string {
  return `LILA-${orderNumber}`
}

// ── API contract: POST /api/orders ─────────────────────────────────────

export type CreateOrderItem = {
  productId: string
  quantity: number
  /** tipo nombre → opción nombre (one option per type). */
  variations?: Record<string, string>
}

export type CreateOrderRequest = {
  catalog: CatalogType
  items: CreateOrderItem[]
  customer: {
    name: string
    phone: string
    documentType: DocumentType
    documentNumber: string
    deliveryType: 'envio' | 'recogida'
    city: string
    cityCode: string
    address: string
    pickupBranch: string
    notes: string
  }
  invoice: {
    wanted: boolean
    email: string
    /** Optional: invoice to a different person / company. */
    otherHolder: boolean
    name: string
    documentType: DocumentType | ''
    documentNumber: string
  }
  paymentMethod: string
  shippingOptionId: string
  receiptPath: string | null
  acceptsPolicies: boolean
  /** Honeypot: real customers never fill it. */
  website?: string
}

export type CreatedOrder = {
  id: string
  number: number
  code: string
  subtotal: number
  shippingCost: number | null
  shippingLabel: string
  surcharge: number
  surchargeLabel: string | null
  total: number
  hasUnpricedItems: boolean
  /** Server price per cart line, same order as the request items. */
  lines: { unitPrice: number | null; lineTotal: number | null }[]
}

export type CreateOrderResponse =
  | { ok: true; order: CreatedOrder }
  | { ok: false; error: string; message: string }
