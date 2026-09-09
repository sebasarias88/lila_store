import type { Metadata } from 'next'
import { createSupabasePublic } from '@/lib/supabase-public'
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
import { getSiteConfig, getSiteName } from '@/lib/site-config'
import { SEO_HOME_DESCRIPTION, SEO_HOME_TITLE } from '@/lib/seo-brand'
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'
import { catalogPath } from '@/lib/catalog'
import { getAnuncioModalVigente } from '@/lib/anuncio-modal-server'
import { PRODUCTO_SHELF_SELECT, mapShelfProductos } from '@/lib/productQueries'
import type { Banner, Categoria, Producto, Promocion } from '@/types'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()

  return buildMetadata({
    config,
    title: SEO_HOME_TITLE,
    description: config.seo_descripcion?.trim() || SEO_HOME_DESCRIPTION,
    path: '/',
    absoluteTitle: true,
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
    const supabase = createSupabasePublic()

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
      supabase
        .from('banners')
        .select(
          'id,imagen_url,titulo,subtitulo,texto_boton,enlace_boton,activo,orden,created_at',
        )
        .eq('activo', true)
        .order('orden'),
      supabase
        .from('promociones')
        .select(
          'id,titulo,descripcion,imagen_url,badge_texto,badge_color,fecha_inicio,fecha_fin,enlace,orden,activa,catalogo',
        )
        .eq('activa', true)
        .eq('catalogo', 'detal')
        .order('orden'),
      supabase
        .from('categorias')
        .select(
          'id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo,subcategorias:categorias!padre_id(id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)',
        )
        .is('padre_id', null)
        .eq('activa', true)
        .order('orden'),
      supabase
        .from('productos')
        .select(PRODUCTO_SHELF_SELECT)
        .eq('disponible_detal', true)
        .eq('destacado', true)
        .order('orden')
        .limit(10),
      supabase
        .from('productos')
        .select(PRODUCTO_SHELF_SELECT)
        .eq('disponible_detal', true)
        .not('precio_antes', 'is', null)
        .order('orden')
        .limit(12),
      supabase
        .from('productos')
        .select(PRODUCTO_SHELF_SELECT)
        .eq('disponible_detal', true)
        .order('created_at', { ascending: false })
        .limit(16),
    ])

    configData?.forEach(row => {
      config[row.clave] = row.valor
    })
    banners = (bannersData as Banner[] | null) || []
    promociones = (promocionesData as Promocion[] | null) || []
    categorias = ((categoriasData as Categoria[] | null) || []).map(raiz => ({
      ...raiz,
      subcategorias: [...(raiz.subcategorias || [])]
        .filter(s => s.activa !== false)
        .sort((a, b) => a.orden - b.orden),
    }))
    destacados = mapShelfProductos(destacadosData)

    const destacadosIds = new Set(destacados.map(p => p.id))

    ofertas = mapShelfProductos(ofertasData)
      .filter(p => p.precio_antes != null && p.precio_antes > p.precio)
      .filter(p => !destacadosIds.has(p.id))
      .slice(0, 10)

    const ofertasIds = new Set(ofertas.map(p => p.id))
    novedades = uniqueById(mapShelfProductos(novedadesData))
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
        nombreNegocio={getSiteName(config)}
      />
    </div>
  )
}
