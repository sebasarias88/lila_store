import { createSupabasePublic } from '@/lib/supabase-public'
import type { Categoria } from '@/types'

const CATEGORIAS_SELECT =
  'id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo,subcategorias:categorias!padre_id(id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)'

export async function fetchCategoriasRaiz(): Promise<Categoria[]> {
  const supabase = createSupabasePublic()
  const { data: cat } = await supabase
    .from('categorias')
    .select(CATEGORIAS_SELECT)
    .is('padre_id', null)
    .eq('activa', true)
    .order('orden')
    .order('orden', { referencedTable: 'subcategorias' })

  return ((cat as Categoria[] | null) ?? []).map(raiz => ({
    ...raiz,
    subcategorias: [...(raiz.subcategorias || [])]
      .filter(s => s.activa !== false)
      .sort((a, b) => a.orden - b.orden),
  }))
}

export function findCategoriaBySlug(
  categoriasRaiz: Categoria[],
  slug: string,
): Categoria | null {
  const needle = slug.trim()
  if (!needle) return null
  for (const raiz of categoriasRaiz) {
    if (raiz.slug === needle) return raiz
    const sub = raiz.subcategorias?.find(s => s.slug === needle)
    if (sub) return sub
  }
  return null
}

/** Todos los slugs activos (raíz + sub) para sitemap. */
export function flattenCategoriaSlugs(categoriasRaiz: Categoria[]): string[] {
  const slugs: string[] = []
  for (const raiz of categoriasRaiz) {
    slugs.push(raiz.slug)
    for (const sub of raiz.subcategorias || []) {
      if (sub.slug) slugs.push(sub.slug)
    }
  }
  return slugs
}
