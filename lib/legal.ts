/**
 * Identity of the data controller and seller, taken from the owner's RUT
 * (DIAN, updated 2026-10-30). Change it here and every legal page updates.
 */
export const LEGAL_OWNER = {
  name: 'Diana Milena Damelines Agudelo',
  personType: 'persona natural',
  nit: '25.026.350-7',
  tradeName: 'Lila Store Quindío',
  address: 'Calle 16 # 13-47, local 3',
  city: 'Armenia, Quindío, Colombia',
  email: 'lilastore759@gmail.com',
  phone: '310 424 4912',
} as const

/** Date shown as "última actualización" on the legal pages. */
export const LEGAL_UPDATED_AT = '17 de noviembre de 2026'

export const LEGAL_LINKS = [
  { href: '/terminos-y-condiciones', label: 'Términos y condiciones' },
  { href: '/politica-de-privacidad', label: 'Política de privacidad' },
  { href: '/politica-de-cookies', label: 'Política de cookies' },
] as const
