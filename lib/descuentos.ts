import { Categoria } from '@/types'

export type CatalogDiscountType = 'detal' | 'mayoreo'

export function calcularPrecioConDescuento(
  precio: number,
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): {
  precioFinal: number
  descuentoAplicado: number
  tieneDescuento: boolean
  porcentaje: number
} {
  const noneResult = {
    precioFinal: precio,
    descuentoAplicado: 0,
    tieneDescuento: false,
    porcentaje: 0,
  }

  if (!categoria) return noneResult

  const activo =
    catalogType === 'mayoreo'
      ? categoria.descuento_activo_mayoreo
      : categoria.descuento_activo

  const porcentaje =
    catalogType === 'mayoreo'
      ? categoria.descuento_porcentaje_mayoreo
      : categoria.descuento_porcentaje

  const fechaFin =
    catalogType === 'mayoreo'
      ? categoria.descuento_fecha_fin_mayoreo
      : categoria.descuento_fecha_fin

  if (!activo || !porcentaje) return noneResult

  if (fechaFin) {
    const fin = new Date(fechaFin)
    if (!Number.isNaN(fin.getTime()) && fin < new Date()) return noneResult
  }

  const descuento = porcentaje / 100
  const precioFinal = Math.round(precio * (1 - descuento))
  const descuentoAplicado = precio - precioFinal

  return {
    precioFinal,
    descuentoAplicado,
    tieneDescuento: precioFinal < precio,
    porcentaje,
  }
}

export function formatDescuento(porcentaje: number): string {
  return `-${porcentaje}%`
}

export function categoriaTieneDescuentoActivo(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): boolean {
  return calcularPrecioConDescuento(100, categoria, catalogType).tieneDescuento
}

export function getPorcentajeDescuentoActivo(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): number | null {
  const { tieneDescuento, porcentaje } = calcularPrecioConDescuento(
    100,
    categoria,
    catalogType,
  )
  return tieneDescuento ? porcentaje : null
}

/** Campos de categoría para joins de productos (incluye descuentos detal + mayorista). */
export const CATEGORIA_SELECT_FIELDS =
  'id,nombre,slug,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo'
