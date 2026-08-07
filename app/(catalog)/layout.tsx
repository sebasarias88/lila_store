import { createSupabaseServer } from '@/lib/supabase-server'
import AnnouncementBar from '@/components/catalog/AnnouncementBar'
import Navbar from '@/components/catalog/Navbar'
import Footer from '@/components/catalog/Footer'
import PageTransition from '@/components/catalog/PageTransition'
import NavigationProgress from '@/components/catalog/NavigationProgress'
import FloatingWhatsApp from '@/components/catalog/FloatingWhatsApp'
import JsonLd from '@/components/seo/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { resolveWhatsAppNumero } from '@/lib/negocio'

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()

  const { data: configData } = await supabase
    .from('configuracion')
    .select('clave, valor')

  const config: Record<string, string> = {}
  configData?.forEach(row => { config[row.clave] = row.valor })

  const { data: categoriasRaw } = await supabase
    .from('categorias')
    .select('*, subcategorias:categorias!padre_id(*)')
    .is('padre_id', null)
    .eq('activa', true)
    .order('orden')
    .order('orden', { referencedTable: 'subcategorias' })

  const categorias = (categoriasRaw || []).map(raiz => ({
    ...raiz,
    subcategorias: [...(raiz.subcategorias || [])]
      .filter((s: { activa?: boolean }) => s.activa !== false)
      .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
  }))

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <JsonLd data={[organizationJsonLd(config), websiteJsonLd(config)]} />
      <NavigationProgress />
      <AnnouncementBar />
      <Navbar
        nombreNegocio="lila-store"
        categorias={categorias}
        hasAnnouncement
      />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer
        nombreNegocio="lila-store"
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
      />
      <FloatingWhatsApp
        whatsapp={resolveWhatsAppNumero(config['whatsapp_numero'])}
      />
    </div>
  )
}