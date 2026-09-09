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
import { rethrowIfNextControlFlowError } from '@/lib/next-errors'
import { getAnuncioModalVigente } from '@/lib/anuncio-modal-server'
import { PRODUCTO_SHELF_SELECT, mapShelfProductos } from '@/lib/productQueries'
import type { Banner, Categoria, Producto, Promocion } from '@/types'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  const siteName = getSiteName(config)

  return buildMetadata({
    config,
    title: 'Catálogo mayorista',
    description:
      (config.mayoreo_titulo?.trim() && !/mayoreo/i.test(config.mayoreo_titulo)
        ? config.mayoreo_titulo.trim()
        : '') ||
      config.seo_descripcion?.trim() ||
      `Catálogo mayorista de belleza y cuidado capilar en ${siteName}.`,
    path: '/mayorista',
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

export default async function MayoreoHomePage() {
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
        .eq('catalogo', 'mayoreo')
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
        .eq('disponible_mayoreo', true)
        .eq('destacado', true)
        .order('orden')
        .limit(10),
      supabase
        .from('productos')
        .select(PRODUCTO_SHELF_SELECT)
        .eq('disponible_mayoreo', true)
        .not('precio_antes_mayoreo', 'is', null)
        .order('orden')
        .limit(10),
      supabase
        .from('productos')
        .select(PRODUCTO_SHELF_SELECT)
        .eq('disponible_mayoreo', true)
        .order('created_at', { ascending: false })
        .limit(10),
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
      .filter(p => {
        const antes = p.precio_antes_mayoreo
        const actual = p.precio_mayoreo ?? p.precio
        return antes != null && actual != null && antes > actual
      })
      .filter(p => !destacadosIds.has(p.id))
      .slice(0, 10)
    const ofertasIds = new Set(ofertas.map(p => p.id))
    novedades = uniqueById(mapShelfProductos(novedadesData))
      .filter(p => !destacadosIds.has(p.id) && !ofertasIds.has(p.id))
      .slice(0, 10)
  } catch (error) {
    rethrowIfNextControlFlowError(error)
    console.error('[MayoreoHomePage] Error cargando datos:', error)
  }

  const anuncioModal = await getAnuncioModalVigente()

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <AnuncioModalPromo anuncio={anuncioModal} catalogType="mayoreo" />
      <HeroBanner banners={banners} config={config} catalogType="mayoreo" />
      <CategoriasGrid categorias={categorias} catalogType="mayoreo" />
      <ProductosDestacados productos={destacados} catalogType="mayoreo" />
      <PromoStrip promociones={promociones} />
      <ProductosNovedades productos={novedades} catalogType="mayoreo" />
      <ProductosOfertas productos={ofertas} catalogType="mayoreo" />
      <ProcesoPedido catalogHref="/mayorista/productos" variant="whatsapp" />
      <TestimoniosSection />
      <NosotrosSection
        texto={config['texto_nosotros'] || ''}
        whatsapp={config['whatsapp_numero']}
        nombreNegocio={getSiteName(config)}
        catalogType="mayoreo"
      />
    </div>
  )
}
