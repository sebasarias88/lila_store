import { createSupabaseServer } from '@/lib/supabase-server'
import Navbar from '@/components/catalog/Navbar'
import Footer from '@/components/catalog/Footer'
import PageTransition from '@/components/catalog/PageTransition'
import NavigationProgress from '@/components/catalog/NavigationProgress'
import FloatingWhatsApp from '@/components/catalog/FloatingWhatsApp'
import { formatPrecio, MAYOREO_MIN_COMPRA, MAYOREO_RECOMPRA } from '@/lib/catalog'

export default async function MayoreoLayout({
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
      <NavigationProgress />
      <div className="catalog-announcement fixed left-0 right-0 top-0 z-40 flex h-9 items-center justify-center gap-2 px-3 text-[12px] font-bold text-white">
        <span>
          ✨ Compra mínima{' '}
          <span className="font-extrabold">{formatPrecio(MAYOREO_MIN_COMPRA)}</span>
        </span>
        <span className="opacity-80" aria-hidden>
          ♡
        </span>
        <span>
          Recompra{' '}
          <span className="font-extrabold">{formatPrecio(MAYOREO_RECOMPRA)}</span>
        </span>
      </div>
      <Navbar
        nombreNegocio="lila-store"
        categorias={categorias}
        catalogType="mayoreo"
      />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer
        nombreNegocio="lila-store"
        whatsapp={config['whatsapp_numero'] || '573185867702'}
        catalogType="mayoreo"
      />
      <FloatingWhatsApp
        whatsapp={config['whatsapp_numero'] || '573185867702'}
        catalogType="mayoreo"
      />
    </div>
  )
}
