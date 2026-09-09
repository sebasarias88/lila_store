import { Categoria } from '@/types'

export type CatalogDiscountType = 'detal' | 'mayoreo'

type DiscountSnapshot = {
  activo: boolean
  porcentaje: number
  fechaFin: string | null
}

function snapshotCategoria(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType,
): DiscountSnapshot | null {
  if (!categoria) return null
  return {
    activo:
      catalogType === 'mayoreo'
        ? Boolean(categoria.descuento_activo_mayoreo)
        : Boolean(categoria.descuento_activo),
    porcentaje:
      catalogType === 'mayoreo'
        ? Number(categoria.descuento_porcentaje_mayoreo) || 0
        : Number(categoria.descuento_porcentaje) || 0,
    fechaFin:
      catalogType === 'mayoreo'
        ? categoria.descuento_fecha_fin_mayoreo
        : categoria.descuento_fecha_fin,
  }
}

function snapshotVigente(snap: DiscountSnapshot | null): DiscountSnapshot | null {
  if (!snap?.activo || !snap.porcentaje) return null
  if (snap.fechaFin) {
    const fin = new Date(snap.fechaFin)
    if (!Number.isNaN(fin.getTime()) && fin < new Date()) return null
  }
  return snap
}

/**
 * Descuento propio de la categoría, o herencia del padre si no tiene propio.
 */
export function resolveDescuentoCategoria(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): DiscountSnapshot | null {
  const propio = snapshotVigente(snapshotCategoria(categoria, catalogType))
  if (propio) return propio
  return snapshotVigente(snapshotCategoria(categoria?.padre, catalogType))
}

/**
 * Mejor % entre la categoría primaria y todas las asignadas (con herencia).
 */
export function resolveDescuentoProducto(
  producto: {
    categoria?: Categoria | null
    categorias?: Categoria[] | null
  },
  catalogType: CatalogDiscountType = 'detal',
): DiscountSnapshot | null {
  const candidatos: (Categoria | null | undefined)[] = [
    producto.categoria,
    ...(producto.categorias || []),
  ]
  let best: DiscountSnapshot | null = null
  for (const cat of candidatos) {
    const snap = resolveDescuentoCategoria(cat, catalogType)
    if (!snap) continue
    if (!best || snap.porcentaje > best.porcentaje) best = snap
  }
  return best
}

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

  const snap = resolveDescuentoCategoria(categoria, catalogType)
  if (!snap) return noneResult

  const descuento = snap.porcentaje / 100
  const precioFinal = Math.round(precio * (1 - descuento))
  const descuentoAplicado = precio - precioFinal

  return {
    precioFinal,
    descuentoAplicado,
    tieneDescuento: precioFinal < precio,
    porcentaje: snap.porcentaje,
  }
}

export function formatDescuento(porcentaje: number): string {
  return `-${porcentaje}%`
}

export function categoriaTieneDescuentoActivo(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): boolean {
  return resolveDescuentoCategoria(categoria, catalogType) != null
}

export function getPorcentajeDescuentoActivo(
  categoria: Categoria | null | undefined,
  catalogType: CatalogDiscountType = 'detal',
): number | null {
  return resolveDescuentoCategoria(categoria, catalogType)?.porcentaje ?? null
}

/** Campos de categoría para joins de productos (incluye descuentos detal + mayorista). */
export const CATEGORIA_SELECT_FIELDS =
  'id,nombre,slug,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo'
