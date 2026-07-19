import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import HeroBanner from '@/components/catalog/HeroBanner'
import TrustStrip from '@/components/catalog/TrustStrip'
import PromoStrip from '@/components/catalog/PromoStrip'
import CategoriasGrid from '@/components/catalog/CategoriasGrid'
import ProductosDestacados from '@/components/catalog/ProductosDestacados'
import ProductosOfertas from '@/components/catalog/ProductosOfertas'
import ProductosNovedades from '@/components/catalog/ProductosNovedades'
import TestimoniosSection from '@/components/catalog/TestimoniosSection'
import NosotrosSection from '@/components/catalog/NosotrosSection'
import ProcesoPedido from '@/components/catalog/ProcesoPedido'
import { buildMetadata } from '@/lib/seo'
import { getSiteConfig, getSiteDescription } from '@/lib/site-config'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'
import type { Banner, Categoria, Producto, Promocion } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()

  return buildMetadata({
    config,
    title: 'Catálogo detal',
    description:
      config.seo_descripcion?.trim() ||
      getSiteDescription(config),
    path: '/',
  })
}

function uniqueById(items: Producto[]) {
  const seen = new Set<string>()
  return items.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export default async function HomePage() {
  const config: Record<string, string> = {}
  let banners: Banner[] = []
  let promociones: Promocion[] = []
  let categorias: Categoria[] = []
  let destacados: Producto[] = []
  let ofertas: Producto[] = []
  let novedades: Producto[] = []

  try {
    const supabase = await createSupabaseServer()

    const [
      { data: configData },
      { data: bannersData },
      { data: promocionesData },
      { data: categoriasData },
      { data: destacadosData },
      { data: ofertasData },
      { data: novedadesData },
    ] = await Promise.all([
      supabase.from('configuracion').select('clave, valor'),
      supabase.from('banners').select('*').eq('activo', true).order('orden'),
      supabase.from('promociones').select('*').eq('activa', true).order('orden'),
      supabase.from('categorias').select('*, subcategorias:categorias!padre_id(*)')
        .is('padre_id', null).eq('activa', true).order('orden'),
      supabase.from('productos')
        .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
        .eq('disponible_detal', true)
        .eq('destacado', true)
        .order('orden')
        .limit(10),
      supabase.from('productos')
        .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
        .eq('disponible_detal', true)
        .not('precio_antes', 'is', null)
        .order('orden')
        .limit(10),
      supabase.from('productos')
        .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
        .eq('disponible_detal', true)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    configData?.forEach(row => { config[row.clave] = row.valor })
    banners = (bannersData as Banner[] | null) || []
    promociones = (promocionesData as Promocion[] | null) || []
    categorias = (categoriasData as Categoria[] | null) || []
    destacados = (destacadosData as Producto[] | null) || []
    ofertas = ((ofertasData as Producto[] | null) || []).filter(
      p => p.precio_antes != null && p.precio_antes > p.precio,
    )
    const destacadosIds = new Set(destacados.map(p => p.id))
    novedades = uniqueById((novedadesData as Producto[] | null) || []).filter(
      p => !destacadosIds.has(p.id),
    ).slice(0, 10)
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[HomePage] Error cargando datos:', error)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <HeroBanner banners={banners} config={config} />
      <TrustStrip />
      <CategoriasGrid categorias={categorias} />
      <PromoStrip promociones={promociones} />
      <ProductosDestacados productos={destacados} />
      <ProductosNovedades productos={novedades} />
      <ProductosOfertas productos={ofertas} />
      <TestimoniosSection />
      <NosotrosSection
        texto={config['texto_nosotros'] || ''}
        whatsapp={config['whatsapp_numero'] || '573185867702'}
        nombreNegocio="lila-store"
      />
      <ProcesoPedido />
    </div>
  )
}
