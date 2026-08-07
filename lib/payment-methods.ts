import type { TipoEntrega } from '@/types'

export type MetodoPagoOpcion = {
  id: string
  /** Texto que se guarda en el pedido / WhatsApp */
  label: string
  /** Línea corta bajo el nombre */
  hint?: string
  /** Cuándo se muestra en el checkout */
  disponibilidad: 'siempre' | 'envio' | 'recogida'
}

/**
 * Medios listos para seleccionar en el catálogo.
 * La pasarela real (ePayco / Addi / etc.) se conecta en otra rama;
 * aquí solo organizamos las opciones del checkout.
 */
export const METODOS_PAGO_CATALOG: MetodoPagoOpcion[] = [
  {
    id: 'epayco',
    label: 'ePayco',
    hint: 'Tarjeta · PSE · Nequi y más',
    disponibilidad: 'siempre',
  },
  {
    id: 'addi',
    label: 'Addi',
    hint: 'Paga a cuotas',
    disponibilidad: 'siempre',
  },
  {
    id: 'sistecredito',
    label: 'Sistecrédito',
    hint: 'Crédito inmediato',
    disponibilidad: 'siempre',
  },
  {
    id: 'supay',
    label: 'Su+ Pay',
    hint: 'Pago digital',
    disponibilidad: 'siempre',
  },
  {
    id: 'efectivo-entrega',
    label: 'Efectivo contra entrega',
    hint: 'Pagas al recibir',
    disponibilidad: 'envio',
  },
  {
    id: 'efectivo-tienda',
    label: 'Efectivo en tienda',
    hint: 'Pagas al recoger',
    disponibilidad: 'recogida',
  },
]

export function metodosPagoParaCheckout(
  tipoEntrega: TipoEntrega = 'envio',
): MetodoPagoOpcion[] {
  const modo = tipoEntrega === 'recogida' ? 'recogida' : 'envio'
  return METODOS_PAGO_CATALOG.filter(
    m => m.disponibilidad === 'siempre' || m.disponibilidad === modo,
  )
}
