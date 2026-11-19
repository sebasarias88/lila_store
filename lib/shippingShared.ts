/** Shipping types and constants safe for the browser (no secrets, no server code). */

export const ARMENIA_DANE = '63001000'
export const DANE_CODE_RE = /^\d{8}$/

export type ShippingCity = { code: string; name: string; department: string }
export type ShippingOption = { id: string; carrier: string; cost: number; days: number | null }
export type ShippingPackage = {
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

export function formatShippingDays(days: number | null): string {
  if (days == null) return 'Tiempo según transportadora'
  return days === 1 ? '1 día hábil aprox.' : `${days} días hábiles aprox.`
}
