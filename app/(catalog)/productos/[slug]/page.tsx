import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductoDetalle from '@/components/catalog/ProductoDetalle'
import ProductosRelacionados from '@/components/catalog/ProductosRelacionados'
import ProductPageSeo from '@/components/seo/ProductPageSeo'
import { normalizarVariacionesProducto } from '@/lib/variaciones'
import { buildProductMetadata } from '@/lib/seo'
import { getSiteConfig } from '@/lib/site-config'
import { ProductoSeccion, VariacionTipo } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createSupabaseServer()
  const config = await getSiteConfig()

  const { data } = await supabase
    .from('productos')
    .select('nombre, descripcion, imagenes, slug')
    .eq('slug', slug)
    .single()

  if (!data) {
    return { title: 'Producto no encontrado', robots: { index: false, follow: false } }
  }

  return buildProductMetadata(config, data, 'detal')
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServer()
  const config = await getSiteConfig()

  const { data: producto, error } = await supabase
    .from('productos')
    .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
    .eq('slug', slug)
    .single()

  if (error || !producto) notFound()
  if (producto.disponible_detal === false) notFound()

  const { data: relacionados } = await supabase
    .from('productos')
    .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
    .eq('categoria_id', producto.categoria_id)
    .eq('disponible', true)
    .neq('id', producto.id)
    .limit(4)

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
      <ProductPageSeo config={config} producto={producto} />
      <ProductoDetalle
        producto={producto}
        variaciones={variaciones}
        secciones={(secciones || []) as ProductoSeccion[]}
      />
      {relacionados && relacionados.length > 0 && (
        <ProductosRelacionados productos={relacionados} />
      )}
    </>
  )
}
