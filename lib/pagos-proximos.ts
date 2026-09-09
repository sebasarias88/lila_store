/** Medios de pago próximos en la web (pasarelas en desarrollo). */
export const PAGOS_EN_DESARROLLO = [
  { id: 'epayco', label: 'ePayco', detalle: 'Tarjeta · PSE' },
  { id: 'addi', label: 'Addi', detalle: 'A cuotas' },
  { id: 'sistecredito', label: 'Sistecrédito', detalle: 'Crédito' },
  { id: 'su-pay', label: 'Su+ Pay', detalle: 'Digital' },
] as const

export const PAGOS_EN_DESARROLLO_LABELS = PAGOS_EN_DESARROLLO.map(p => p.label)

/** Copy corta para chips / listados. */
export const PAGOS_EN_DESARROLLO_RESUMEN = PAGOS_EN_DESARROLLO_LABELS.join(' · ')

/**
 * Mensaje unificado: web hoy = efectivo/transferencia;
 * pasarelas en desarrollo pero disponibles en tienda / WhatsApp.
 */
export const PAGOS_COPY = {
  checkoutIntro: 'Elige efectivo o transferencia para confirmar tu pedido.',
  checkoutNota:
    'Mientras activamos las demás, también las coordinamos en tienda o por WhatsApp 💕',
  procesoHint: 'Efectivo · Transferencia · más medios pronto',
  procesoSubtitulo:
    'Fácil y cute: confirma por WhatsApp. Efectivo y transferencia ya están listos; otros medios llegan pronto.',
  pdpLineaActivos: 'Efectivo o transferencia al confirmar',
  pdpLineaProximos: 'ePayco, Addi, Sistecrédito y Su+ Pay · tienda o WhatsApp',
  drawerHint: 'Efectivo o transferencia · otros medios por WhatsApp',
  resumenHint:
    'Confirmamos por WhatsApp. Si prefieres otro medio, escríbenos y lo coordinamos.',
} as const
