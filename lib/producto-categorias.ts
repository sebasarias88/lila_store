import { Categoria, Producto } from '@/types'

type ProductoCategoriaJoin = {
  categoria_id?: string
  categoria?: Categoria | null
}

type ProductoConJoin = Producto & {
  producto_categorias?: ProductoCategoriaJoin[]
}

/**
 * Normaliza el resultado de la consulta con join `producto_categorias`
 * dejando en `producto.categorias` el arreglo plano de categorías.
 */
export function withProductoCategorias(
  productos: ProductoConJoin[] | null | undefined,
): Producto[] {
  return (productos || []).map(producto => {
    const categorias = (producto.producto_categorias || [])
      .map(pc => pc.categoria)
      .filter((c): c is Categoria => Boolean(c))

    return { ...producto, categorias }
  })
}

/** Slugs de todas las categorías a las que pertenece un producto. */
export function getProductoCategoriaSlugs(producto: Producto): string[] {
  const slugs = new Set<string>()
  if (producto.categoria?.slug) slugs.add(producto.categoria.slug)
  producto.categorias?.forEach(cat => {
    if (cat?.slug) slugs.add(cat.slug)
  })
  return [...slugs]
}
