import { VariacionTipo } from '@/types'

/** Solo tipos con al menos una opción disponible, ordenados. */
export function normalizarVariacionesProducto(
  tipos: VariacionTipo[] | null | undefined,
): VariacionTipo[] {
  if (!tipos?.length) return []

  return tipos
    .map(tipo => ({
      ...tipo,
      opciones: [...(tipo.opciones || [])]
        .filter(o => o.disponible)
        .sort((a, b) => a.orden - b.orden),
    }))
    .filter(tipo => (tipo.opciones?.length ?? 0) > 0)
    .sort((a, b) => a.orden - b.orden)
}

export function buildVariacionesSeleccionadas(
  variaciones: VariacionTipo[],
  selectedByTipoId: Record<string, string[]>,
): Record<string, string> | undefined {
  const result: Record<string, string> = {}

  for (const tipo of variaciones) {
    const opcionIds = selectedByTipoId[tipo.id]
    if (!opcionIds?.length) continue
    // Se respeta el orden de las opciones del tipo para una clave estable.
    const nombres = (tipo.opciones || [])
      .filter(o => opcionIds.includes(o.id))
      .map(o => o.nombre)
    if (nombres.length) result[tipo.nombre] = nombres.join(', ')
  }

  return Object.keys(result).length > 0 ? result : undefined
}
