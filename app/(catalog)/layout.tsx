import { createSupabasePublic } from '@/lib/supabase-public'
import AnnouncementBar from '@/components/catalog/AnnouncementBar'
import Navbar from '@/components/catalog/Navbar'
import Footer from '@/components/catalog/Footer'
import PageTransition from '@/components/catalog/PageTransition'
import NavigationProgress from '@/components/catalog/NavigationProgress'
import FloatingWhatsApp from '@/components/catalog/FloatingWhatsApp'
import JsonLd from '@/components/seo/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { resolveWhatsAppNumero } from '@/lib/negocio'
import { getSiteName } from '@/lib/site-config'
import type { Categoria } from '@/types'

export const revalidate = 60

export default async function CatalogLayout({
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
      <JsonLd data={[organizationJsonLd(config), websiteJsonLd(config)]} />
      <NavigationProgress />
      <AnnouncementBar />
      <Navbar
        nombreNegocio={nombreNegocio}
        categorias={categorias}
        hasAnnouncement
      />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer
        nombreNegocio={nombreNegocio}
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
      />
      <FloatingWhatsApp
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
      />
    </div>
  )
}
