/**
 * Re-lanza los errores internos de control de flujo de Next.js
 * (redirect, notFound, bailout dinámico por `cookies`, etc.) para no
 * tragárnoslos accidentalmente dentro de un try/catch defensivo.
 *
 * Estos errores se identifican por la propiedad `digest` (un string como
 * `NEXT_REDIRECT`, `NEXT_NOT_FOUND` o `DYNAMIC_SERVER_USAGE`). Los errores
 * reales de red/datos (PostgrestError, TypeError, etc.) no la tienen, así
 * que esos sí los capturamos para renderizar un estado vacío.
 */
export function rethrowIfNextControlFlowError(error: unknown): void {
  if (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string'
  ) {
    throw error
  }
}
