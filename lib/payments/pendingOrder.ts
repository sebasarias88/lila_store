'use client'

import type { CatalogType } from '@/lib/catalog'
import type { CreatedOrder } from '@/lib/orders/shared'
import type { DatosCliente, ItemCarrito } from '@/types'

/**
 * While the customer is on Wompi's page we keep what is needed to build the
 * WhatsApp summary when they come back (same browser). Expires in 3 hours.
 */
const KEY = 'lila-pending-payment'
const TTL_MS = 3 * 60 * 60 * 1000

export type PendingPayment = {
  savedAt: number
  order: CreatedOrder
  items: ItemCarrito[]
  datos: DatosCliente
  catalog: CatalogType
  tiempoEntrega: string
}

export function savePendingPayment(p: Omit<PendingPayment, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, savedAt: Date.now() }))
  } catch {
    /* private mode / storage full: the result page still works without it */
  }
}

export function loadPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingPayment
    if (!p?.order?.code || Date.now() - p.savedAt > TTL_MS) return null
    return p
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
