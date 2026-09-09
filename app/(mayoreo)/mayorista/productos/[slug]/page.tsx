import type { Metadata } from 'next'
import { createSupabasePublic } from '@/lib/supabase-public'
import { notFound } from 'next/navigation'
import ProductoDetalle from '@/components/catalog/ProductoDetalle'
import ProductosRelacionados from '@/components/catalog/ProductosRelacionados'
import ProductPageSeo from '@/components/seo/ProductPageSeo'
import { normalizarVariacionesProducto } from '@/lib/variaciones'
import { buildProductMetadata } from '@/lib/seo'
import { getSiteConfig } from '@/lib/site-config'
import {
  PRODUCTO_DETAIL_SELECT,
  PRODUCTO_SHELF_SELECT,
  mapShelfProductos,
} from '@/lib/productQueries'
import { withProductoCategorias } from '@/lib/producto-categorias'
import { Producto, ProductoSeccion, VariacionTipo } from '@/types'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createSupabasePublic()
  const config = await getSiteConfig()

  const { data } = await supabase
    .from('productos')
    .select('nombre, descripcion, imagenes, slug')
    .eq('slug', slug)
    .single()

  if (!data) {
    return { title: 'Producto no encontrado', robots: { index: false, follow: false } }
  }

  return buildProductMetadata(config, data, 'mayoreo')
}

export default async function MayoreoProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabasePublic()
  const config = await getSiteConfig()

  const { data: productoRaw, error } = await supabase
    .from('productos')
    .select(PRODUCTO_DETAIL_SELECT)
    .eq('slug', slug)
    .single()

  const producto = productoRaw as Producto | null
  if (error || !producto) notFound()
  if (producto.disponible_mayoreo === false) notFound()

  const productoMapped = withProductoCategorias([producto])[0] || producto

  const { data: relacionadosRaw } = await supabase
    .from('productos')
    .select(PRODUCTO_SHELF_SELECT)
    .eq('categoria_id', producto.categoria_id)
    .eq('disponible_mayoreo', true)
    .neq('id', producto.id)
    .limit(4)

  const relacionados = mapShelfProductos(relacionadosRaw)

  const { data: variacionesRaw } = await supabase
    .from('variacion_tipos')
    .select('*, opciones:variacion_opciones(*)')
    .eq('producto_id', producto.id)
    .order('orden', { ascending: true })

  const variaciones = normalizarVariacionesProducto(
    (variacionesRaw || []) as VariacionTipo[],
  )

  const { data: secciones } = await supabase
    .from('producto_secciones')
    .select('*')
    .eq('producto_id', producto.id)
    .order('orden', { ascending: true })

  return (
    <>
      <ProductPageSeo config={config} producto={productoMapped} catalogType="mayoreo" />
      <ProductoDetalle
        producto={productoMapped}
        catalogType="mayoreo"
        variaciones={variaciones}
        secciones={(secciones || []) as ProductoSeccion[]}
      />
      {relacionados.length > 0 && (
        <ProductosRelacionados productos={relacionados} catalogType="mayoreo" />
      )}
    </>
  )
}
