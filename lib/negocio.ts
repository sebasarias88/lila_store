/** Datos públicos del negocio — seguro para Client y Server Components */

/** A physical store (table public.sucursales, editable in /admin/sucursales). */
export type Sucursal = {
  id: string
  ciudad: string
  direccion: string
  telefono: string | null
  /** Nota corta opcional (ej. referencia de ubicación) */
  nota?: string | null
  orden?: number
}

/**
 * WhatsApp de consultas (flotante, footer, nosotros, menú, etc.).
 * No usar para el resumen del pedido del carrito.
 */
export const WHATSAPP_CONSULTA_NUMERO = '573104244912'
export const WHATSAPP_CONSULTA_DISPLAY = '310 424 4912'

/**
 * WhatsApp solo para enviar el resumen del pedido desde el carrito
 * (con datos del cliente y productos).
 */
export const WHATSAPP_PEDIDO_NUMERO = '573104244912'
export const WHATSAPP_PEDIDO_DISPLAY = '310 424 4912'

/** Alias: WhatsApp de consultas (footer / display). */
export const WHATSAPP_NUMERO = WHATSAPP_CONSULTA_NUMERO
export const WHATSAPP_DISPLAY = WHATSAPP_CONSULTA_DISPLAY

/**
 * Numbers that must never be used: an old one from another store, and the
 * Servientrega kiosk line (removed Nov 2026). If the admin config still has
 * one of them, the site falls back to the official number.
 */
const WHATSAPP_BLOQUEADOS = new Set([
  '573185867702',
  '3185867702',
  '57318586770',
  '573178928174',
  '3178928174',
])

const WHATSAPP_PEDIDO_DIGITOS = new Set([
  '3104244912',
  '573104244912',
])

function normalizeColombiaWhatsApp(digits: string): string | null {
  if (digits.startsWith('57') && digits.length >= 12) return digits
  if (digits.length === 10) return `57${digits}`
  return null
}

/**
 * WhatsApp de consultas del sitio (botones, footer, flotante…).
 * Si en config está el número de pedidos, se redirige al de consultas.
 */
export function resolveWhatsAppNumero(fromConfig?: string | null): string {
  const digits = (fromConfig || '').replace(/\D/g, '')
  if (
    !digits ||
    WHATSAPP_BLOQUEADOS.has(digits) ||
    WHATSAPP_PEDIDO_DIGITOS.has(digits)
  ) {
    return WHATSAPP_CONSULTA_NUMERO
  }
  return normalizeColombiaWhatsApp(digits) ?? WHATSAPP_CONSULTA_NUMERO
}

/** WhatsApp exclusivo del resumen de pedido (carrito → confirmar). */
export function resolveWhatsAppPedidoNumero(): string {
  return WHATSAPP_PEDIDO_NUMERO
}

export function formatSucursalLabel(s: Sucursal): string {
  const base = `${s.direccion} — ${s.ciudad}`
  return s.nota ? `${base} (${s.nota})` : base
}

export function formatTelefonoDisplay(telefono: string | null | undefined): string {
  if (!telefono) return ''
  const d = telefono.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return telefono
}
