import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import HeroBanner from '@/components/catalog/HeroBanner'
import PromoStrip from '@/components/catalog/PromoStrip'
import CategoriasGrid from '@/components/catalog/CategoriasGrid'
import ProductosDestacados from '@/components/catalog/ProductosDestacados'
import ProductosOfertas from '@/components/catalog/ProductosOfertas'
import ProductosNovedades from '@/components/catalog/ProductosNovedades'
import TestimoniosSection from '@/components/catalog/TestimoniosSection'
import NosotrosSection from '@/components/catalog/NosotrosSection'
import ProcesoPedido from '@/components/catalog/ProcesoPedido'
import AnuncioModalPromo from '@/components/catalog/AnuncioModalPromo'
import { buildMetadata } from '@/lib/seo'
import { getSiteConfig, getSiteDescription } from '@/lib/site-config'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'
import { catalogPath } from '@/lib/catalog'
import { getAnuncioModalVigente } from '@/lib/anuncio-modal-server'
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
      supabase
        .from('promociones')
        .select('*')
        .eq('activa', true)
        .eq('catalogo', 'detal')
        .order('orden'),
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
        .limit(12),
      supabase.from('productos')
        .select('*, categoria:categorias(id,nombre,slug,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)')
        .eq('disponible_detal', true)
        .order('created_at', { ascending: false })
        .limit(16),
    ])

    configData?.forEach(row => { config[row.clave] = row.valor })
    banners = (bannersData as Banner[] | null) || []
    promociones = (promocionesData as Promocion[] | null) || []
    categorias = (categoriasData as Categoria[] | null) || []
    destacados = (destacadosData as Producto[] | null) || []

    const destacadosIds = new Set(destacados.map(p => p.id))

    ofertas = ((ofertasData as Producto[] | null) || [])
      .filter(p => p.precio_antes != null && p.precio_antes > p.precio)
      .filter(p => !destacadosIds.has(p.id))
      .slice(0, 10)

    const ofertasIds = new Set(ofertas.map(p => p.id))
    novedades = uniqueById((novedadesData as Producto[] | null) || [])
      .filter(p => !destacadosIds.has(p.id) && !ofertasIds.has(p.id))
      .slice(0, 10)
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[HomePage] Error cargando datos:', error)
  }

  const anuncioModal = await getAnuncioModalVigente()

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <AnuncioModalPromo anuncio={anuncioModal} catalogType="detal" />
      <HeroBanner banners={banners} config={config} />
      <CategoriasGrid categorias={categorias} />
      <ProductosDestacados productos={destacados} />
      <PromoStrip promociones={promociones} />
      <ProductosNovedades productos={novedades} />
      <ProductosOfertas productos={ofertas} />
      <ProcesoPedido catalogHref={catalogPath('detal', '/productos')} />
      <TestimoniosSection />
      <NosotrosSection
        texto={config['texto_nosotros'] || ''}
        whatsapp={config['whatsapp_numero']}
        nombreNegocio="lila-store"
      />
    </div>
  )
}
