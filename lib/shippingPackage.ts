import type { ShippingPackage } from '@/lib/shippingShared'

/** Admin-editable package settings (table configuracion). */
export const CONFIG_PAQUETE_PESO_BASE = 'envio_paquete_peso_base_kg'
export const CONFIG_PAQUETE_PESO_UNIDAD = 'envio_paquete_peso_unidad_kg'
export const CONFIG_PAQUETE_MEDIDAS = 'envio_paquete_medidas_cm'

export const DEFAULT_PESO_BASE_KG = 1
export const DEFAULT_PESO_UNIDAD_KG = 0.2
export const DEFAULT_MEDIDAS_CM = '25x20x15'

const toNumber = (value: string | undefined, fallback: number) => {
  const n = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Products have no individual weight, so every order is quoted as one standard
 * box: base weight + a little per extra unit, rounded up to whole kilos
 * (carriers charge by kilo). Box size comes from the admin ("25x20x15").
 */
export function buildShippingPackage(config: Record<string, string>, units: number): ShippingPackage {
  const base = toNumber(config[CONFIG_PAQUETE_PESO_BASE], DEFAULT_PESO_BASE_KG)
  const perUnit = toNumber(config[CONFIG_PAQUETE_PESO_UNIDAD], DEFAULT_PESO_UNIDAD_KG)
  const dims = String(config[CONFIG_PAQUETE_MEDIDAS] || DEFAULT_MEDIDAS_CM)
    .split(/[x×*,\s]+/i)
    .map(v => toNumber(v, 0))
    .filter(v => v > 0)
  const [lengthCm, widthCm, heightCm] =
    dims.length === 3 ? dims : DEFAULT_MEDIDAS_CM.split('x').map(Number)

  const weightKg = Math.max(1, Math.ceil(base + perUnit * Math.max(0, units - 1)))
  return {
    weightKg,
    lengthCm: Math.ceil(lengthCm),
    widthCm: Math.ceil(widthCm),
    heightCm: Math.ceil(heightCm),
  }
}
