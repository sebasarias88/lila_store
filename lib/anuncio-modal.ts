import type { AnuncioModal } from '@/types'

export type AnuncioVigencia = 'activo' | 'programado' | 'expirado' | 'inactivo'

export function getAnuncioVigencia(
  anuncio: Pick<AnuncioModal, 'activo' | 'fecha_inicio' | 'fecha_fin'>,
  now = new Date(),
): AnuncioVigencia {
  if (!anuncio.activo) return 'inactivo'

  const inicio = anuncio.fecha_inicio ? new Date(anuncio.fecha_inicio) : null
  const fin = anuncio.fecha_fin ? new Date(anuncio.fecha_fin) : null

  if (inicio && !Number.isNaN(inicio.getTime()) && inicio > now) {
    return 'programado'
  }
  if (fin && !Number.isNaN(fin.getTime()) && fin < now) {
    return 'expirado'
  }
  return 'activo'
}

export function isAnuncioVigente(
  anuncio: Pick<AnuncioModal, 'activo' | 'fecha_inicio' | 'fecha_fin'>,
  now = new Date(),
): boolean {
  return getAnuncioVigencia(anuncio, now) === 'activo'
}

export function sessionKeyAnuncio(id: string): string {
  return `lila-anuncio-modal-visto:${id}`
}

export function addDaysIso(days: number, from = new Date()): {
  fecha_inicio: string
  fecha_fin: string
} {
  const inicio = new Date(from)
  const fin = new Date(from)
  fin.setDate(fin.getDate() + days)
  return {
    fecha_inicio: inicio.toISOString(),
    fecha_fin: fin.toISOString(),
  }
}

export function endOfDayIso(dateYmd: string): string | null {
  if (!dateYmd.trim()) return null
  const d = new Date(`${dateYmd}T23:59:59`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
