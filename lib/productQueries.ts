import type { Categoria, Producto } from '@/types'
import { CATEGORIA_SELECT_FIELDS } from '@/lib/descuentos'

/** Columnas de producto para cards / shelves (sin descripción larga). */
export const PRODUCTO_CARD_COLUMNS = [
  'id',
  'nombre',
  'slug',
  'precio',
  'precio_antes',
  'precio_mayoreo',
  'precio_antes_mayoreo',
  'stock_detal',
  'stock_mayoreo',
  'disponible',
  'disponible_detal',
  'disponible_mayoreo',
  'destacado',
  'marca',
  'categoria_id',
  'imagenes',
  'video_url',
  'video_tipo',
  'sku',
  'orden',
  'created_at',
  'updated_at',
].join(',')

/** Solo IDs de tipos — para saber si el producto tiene variaciones sin traer opciones. */
export const PRODUCTO_VARIACIONES_FLAG_EMBED = 'variacion_tipos(id)'

/** Categoría con descuentos (+ padre para herencia). */
export const CATEGORIA_PADRE_EMBED = `categoria:categorias(${CATEGORIA_SELECT_FIELDS},padre:categorias!padre_id(${CATEGORIA_SELECT_FIELDS}))`

export const PRODUCTO_CATEGORIAS_EMBED = `producto_categorias(categoria_id,categoria:categorias(${CATEGORIA_SELECT_FIELDS},padre:categorias!padre_id(${CATEGORIA_SELECT_FIELDS})))`

/** Home / carruseles / relacionados. */
export const PRODUCTO_SHELF_SELECT = [
  PRODUCTO_CARD_COLUMNS,
  CATEGORIA_PADRE_EMBED,
  PRODUCTO_VARIACIONES_FLAG_EMBED,
].join(',')

/** Listado de catálogo paginado (multi-categoría). */
export const PRODUCTO_LIST_SELECT = [
  PRODUCTO_CARD_COLUMNS,
  CATEGORIA_PADRE_EMBED,
  PRODUCTO_CATEGORIAS_EMBED,
  PRODUCTO_VARIACIONES_FLAG_EMBED,
].join(',')

/** PDP: campos necesarios para ficha (sin secciones/variaciones — van en queries aparte). */
export const PRODUCTO_DETAIL_SELECT = [
  PRODUCTO_CARD_COLUMNS,
  'descripcion',
  CATEGORIA_PADRE_EMBED,
  PRODUCTO_CATEGORIAS_EMBED,
].join(',')

type VariacionFlagRow = { id?: string } | null

type ProductoConEmbed = Producto & {
  variacion_tipos?: VariacionFlagRow[] | null
  tiene_variaciones?: boolean
}

/** Deja solo la primera imagen en memoria (cards / shelves). */
export function withCardImagenes<T extends { imagenes?: string[] | null }>(
  productos: T[],
): T[] {
  return productos.map(p => {
    const imgs = p.imagenes
    if (!imgs?.length) return { ...p, imagenes: [] as string[] }
    return { ...p, imagenes: [imgs[0]] }
  })
}

/** Mapea embed `variacion_tipos(id)` → `tiene_variaciones: boolean`. */
export function withProductoVariacionesFlag<T extends ProductoConEmbed>(
  productos: T[],
): (Omit<T, 'variacion_tipos'> & { tiene_variaciones: boolean })[] {
  return productos.map(p => {
    const { variacion_tipos, ...rest } = p
    const tiene = Array.isArray(variacion_tipos) && variacion_tipos.length > 0
    return { ...rest, tiene_variaciones: tiene }
  })
}

/** Pipeline estándar para productos de card/shelf. */
export function mapShelfProductos(raw: unknown): Producto[] {
  if (!Array.isArray(raw) || !raw.length) return []
  return withCardImagenes(
    withProductoVariacionesFlag(raw as ProductoConEmbed[]),
  ) as Producto[]
}

export function mapListProductos(raw: unknown): Producto[] {
  return mapShelfProductos(raw)
}
