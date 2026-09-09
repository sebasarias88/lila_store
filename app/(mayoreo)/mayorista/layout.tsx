import { createSupabasePublic } from '@/lib/supabase-public'
import Navbar from '@/components/catalog/Navbar'
import Footer from '@/components/catalog/Footer'
import PageTransition from '@/components/catalog/PageTransition'
import NavigationProgress from '@/components/catalog/NavigationProgress'
import FloatingWhatsApp from '@/components/catalog/FloatingWhatsApp'
import {
  CONFIG_MAYORISTA_MINIMO,
  CONFIG_MAYORISTA_RECOMPRA,
  formatPrecio,
  MAYOREO_MIN_COMPRA,
  MAYOREO_RECOMPRA,
  parseMayoristaConfigMonto,
} from '@/lib/catalog'
import { resolveWhatsAppNumero } from '@/lib/negocio'
import { getSiteName } from '@/lib/site-config'
import type { Categoria } from '@/types'

export const revalidate = 60

export default async function MayoreoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabasePublic()

  const { data: configData } = await supabase
    .from('configuracion')
    .select('clave, valor')

  const config: Record<string, string> = {}
  configData?.forEach(row => {
    config[row.clave] = row.valor
  })
  const nombreNegocio = getSiteName(config)

  const minimoCompra = parseMayoristaConfigMonto(
    config[CONFIG_MAYORISTA_MINIMO],
    MAYOREO_MIN_COMPRA,
  )
  const recompraSugerida = parseMayoristaConfigMonto(
    config[CONFIG_MAYORISTA_RECOMPRA],
    MAYOREO_RECOMPRA,
  )

  const { data: categoriasRaw } = await supabase
    .from('categorias')
    .select(
      'id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo,subcategorias:categorias!padre_id(id,nombre,slug,imagen_url,orden,activa,padre_id,descuento_porcentaje,descuento_activo,descuento_fecha_fin,descuento_porcentaje_mayoreo,descuento_activo_mayoreo,descuento_fecha_fin_mayoreo)',
    )
    .is('padre_id', null)
    .eq('activa', true)
    .order('orden')
    .order('orden', { referencedTable: 'subcategorias' })

  const categorias = ((categoriasRaw || []).map(raiz => ({
    ...raiz,
    subcategorias: [...(raiz.subcategorias || [])]
      .filter((s: { activa?: boolean }) => s.activa !== false)
      .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
  })) as unknown) as Categoria[]

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <NavigationProgress />
      <div className="catalog-announcement fixed left-0 right-0 top-0 z-40 flex h-9 items-center justify-center gap-2 px-3 text-[12px] font-bold text-white">
        <span>
          Pedido mínimo{' '}
          <span className="font-extrabold">{formatPrecio(minimoCompra)}</span>
        </span>
        {recompraSugerida > 0 ? (
          <>
            <span className="opacity-80" aria-hidden>
              ·
            </span>
            <span className="font-medium opacity-90">
              Recompra sugerida{' '}
              <span className="font-extrabold">{formatPrecio(recompraSugerida)}</span>
            </span>
          </>
        ) : null}
      </div>
      <Navbar
        nombreNegocio={nombreNegocio}
        categorias={categorias}
        catalogType="mayoreo"
      />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer
        nombreNegocio={nombreNegocio}
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
        catalogType="mayoreo"
      />
      <FloatingWhatsApp
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
        catalogType="mayoreo"
      />
    </div>
  )
}
