/** Datos públicos del negocio — seguro para Client y Server Components */

export type Sucursal = {
  ciudad: string
  direccion: string
  telefono: string
  /** Nota corta opcional (ej. referencia de ubicación) */
  nota?: string
}

/**
 * WhatsApp de consultas (flotante, footer, nosotros, menú, etc.).
 * No usar para el resumen del pedido del carrito.
 */
export const WHATSAPP_CONSULTA_NUMERO = '573178928174'
export const WHATSAPP_CONSULTA_DISPLAY = '317 892 8174'

/**
 * WhatsApp solo para enviar el resumen del pedido desde el carrito
 * (con datos del cliente y productos).
 */
export const WHATSAPP_PEDIDO_NUMERO = '573104244912'
export const WHATSAPP_PEDIDO_DISPLAY = '310 424 4912'

/** Alias: WhatsApp de consultas (footer / display). */
export const WHATSAPP_NUMERO = WHATSAPP_CONSULTA_NUMERO
export const WHATSAPP_DISPLAY = WHATSAPP_CONSULTA_DISPLAY

/** Números antiguos de otra tienda — no usar. */
const WHATSAPP_BLOQUEADOS = new Set([
  '573185867702',
  '3185867702',
  '57318586770',
])

const WHATSAPP_PEDIDO_DIGITOS = new Set([
  '3104244912',
  '573104244912',
])

export const SUCURSALES: Sucursal[] = [
  {
    ciudad: 'Quimbaya, Quindío',
    direccion: 'Calle 18 No 5-23',
    telefono: '3104244912',
  },
  {
    ciudad: 'Armenia, Quindío',
    direccion: 'Cra 15 calle 16 esquina',
    telefono: '3178928174',
    nota: 'Burbuja al interior del Servientrega',
  },
  {
    ciudad: 'Armenia, Quindío',
    direccion: 'Calle 16 No 13-47 local 3',
    telefono: '3237723175',
  },
]

/** Sucursal principal (primera / WhatsApp). */
export const DIRECCION_NEGOCIO = SUCURSALES[0].direccion
export const CIUDAD_NEGOCIO = 'Armenia y Quimbaya, Quindío'
export const DIRECCION_COMPLETA = `${SUCURSALES[0].direccion}, ${SUCURSALES[0].ciudad}`

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

export function findSucursalByLabel(label: string): Sucursal | undefined {
  return SUCURSALES.find(s => formatSucursalLabel(s) === label)
}

export function formatTelefonoDisplay(telefono: string): string {
  const d = telefono.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return telefono
}
