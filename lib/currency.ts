/**
 * Utilidades para montos en pesos colombianos (COP).
 *
 * En es-CO el punto (.) separa miles y la coma (,) los decimales.
 * Ej: 45.000 = 45000 | 1.234.567,50 = 1234567.5
 *
 * JavaScript usa el formato anglosajón (45.000 = 45), por eso hay que
 * normalizar antes de guardar.
 */

/** Solo dígitos, puntos y comas — para filtrar mientras se escribe. */
export function sanitizeCopInput(value: string): string {
  return value.replace(/[^\d.,]/g, '')
} 

/**
 * Convierte texto en formato colombiano o plano a número.
 * Acepta: "45000", "45.000", "1.234.567", "45,50", "1.234.567,50"
 */
export function parseCopInput(value: string): number | null {
  let raw = sanitizeCopInput(value.trim())
  if (!raw) return null

  // Separador al final: el usuario aún estaba escribiendo (ej. "45.")
  raw = raw.replace(/[.,]$/, '')
  if (!raw) return null

  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')

  let normalized: string

  if (hasComma && hasDot) {
    // 1.234.567,50 → miles con punto, decimales con coma
    normalized = raw.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    // 45,50 → coma decimal
    normalized = raw.replace(',', '.')
  } else if (hasDot) {
    // 45.000 o 1.234.567 → punto como separador de miles
    normalized = raw.replace(/\./g, '')
  } else {
    normalized = raw
  }

  const num = Number(normalized)
  if (!Number.isFinite(num) || num < 0) return null
  return num
}

/** Formato visual es-CO sin decimales (típico en COP). */
export function formatCopInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function isValidCopInput(value: string): boolean {
  return parseCopInput(value) !== null
}

/** Para valores guardados como string en configuración. */
export function parseCopValue(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0
  if (typeof value === 'number') return value
  return parseCopInput(value) ?? 0
}
