import type { MetodoPago } from '@/types'
import type { CatalogType } from '@/lib/catalog'

/** Opción lista para el picker del checkout. */
export type MetodoPagoOpcion = {
  id: string
  /** Texto que se guarda en el pedido / WhatsApp */
  label: string
  /** Línea corta bajo el nombre */
  hint?: string
  /** % de recargo para el catálogo actual */
  porcentaje: number
}

export function formatPorcentajeRecargo(porcentaje: number): string {
  const n = Number(porcentaje) || 0
  if (Number.isInteger(n)) return String(n)
  return n
    .toFixed(2)
    .replace(/\.?0+$/, '')
}

/** Porcentaje de recargo según catálogo (detal | mayoreo). */
export function recargoPorcentajeCatalogo(
  metodo: MetodoPago,
  catalogType: CatalogType,
): number {
  const raw =
    catalogType === 'mayoreo'
      ? metodo.recargo_mayoreo_porcentaje
      : metodo.recargo_detal_porcentaje
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Monto del recargo sobre el subtotal de productos (COP, entero). */
export function calcularRecargoPago(
  subtotal: number,
  porcentaje: number,
): number {
  if (subtotal <= 0 || porcentaje <= 0) return 0
  return Math.round(subtotal * (porcentaje / 100))
}

export function metodoPagoToOpcion(
  metodo: MetodoPago,
  catalogType: CatalogType,
): MetodoPagoOpcion {
  const porcentaje = recargoPorcentajeCatalogo(metodo, catalogType)
  return {
    id: metodo.id,
    label: metodo.nombre,
    hint:
      porcentaje > 0
        ? `Recargo ${formatPorcentajeRecargo(porcentaje)}%`
        : undefined,
    porcentaje,
  }
}

export function findMetodoPagoByNombre(
  metodos: MetodoPago[],
  nombre: string,
): MetodoPago | undefined {
  const needle = nombre.trim().toLowerCase()
  return metodos.find(m => m.nombre.trim().toLowerCase() === needle)
}

export type ResumenRecargoPago = {
  nombre: string
  porcentaje: number
  monto: number
  /** Ej: "Recargo Addi (6%)" */
  labelLinea: string
}

export function buildResumenRecargoPago(
  metodos: MetodoPago[],
  metodoNombre: string,
  subtotal: number,
  catalogType: CatalogType,
): ResumenRecargoPago | null {
  const metodo = findMetodoPagoByNombre(metodos, metodoNombre)
  if (!metodo) return null
  const porcentaje = recargoPorcentajeCatalogo(metodo, catalogType)
  const monto = calcularRecargoPago(subtotal, porcentaje)
  if (monto <= 0 || porcentaje <= 0) return null
  return {
    nombre: metodo.nombre,
    porcentaje,
    monto,
    labelLinea: `Recargo ${metodo.nombre} (${formatPorcentajeRecargo(porcentaje)}%)`,
  }
}
