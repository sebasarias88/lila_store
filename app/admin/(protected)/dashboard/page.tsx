import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardView from '@/components/admin/DashboardView'

function formatFecha(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()

  const [
    { count: totalProductos },
    { count: totalCategorias },
    { count: agotados },
    { count: destacados },
    { data: productosRecientes },
    { data: productosAgotados },
  ] = await Promise.all([
    supabase.from('productos').select('*', { count: 'exact', head: true }),
    supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('productos').select('*', { count: 'exact', head: true }).eq('disponible', false),
    supabase.from('productos').select('*', { count: 'exact', head: true }).eq('destacado', true),
    supabase
      .from('productos')
      .select('id, nombre, slug, precio, disponible, imagenes, created_at, categoria:categorias(nombre)')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('productos')
      .select('id, nombre, slug, imagenes')
      .eq('disponible', false)
      .order('updated_at', { ascending: false })
      .limit(3),
  ])

  const disponibles = (totalProductos ?? 0) - (agotados ?? 0)
  const hoy = formatFecha(new Date().toISOString())

  const stats = [
    {
      label: 'Total productos',
      value: totalProductos ?? 0,
      hint: 'En catálogo',
      iconKey: 'package' as const,
      accent: 'var(--accent-primary)',
      bg: 'rgba(169,137,224,0.12)',
    },
    {
      label: 'Categorías activas',
      value: totalCategorias ?? 0,
      hint: 'Visibles en tienda',
      iconKey: 'tag' as const,
      accent: 'var(--accent-secondary)',
      bg: 'rgba(169,137,224,0.08)',
    },
    {
      label: 'Disponibles',
      value: disponibles,
      hint: 'Listos para vender',
      iconKey: 'trending' as const,
      accent: 'var(--success)',
      bg: 'rgba(143,217,182,0.16)',
    },
    {
      label: 'Agotados',
      value: agotados ?? 0,
      hint: 'Requieren atención',
      iconKey: 'alert' as const,
      accent: 'var(--danger)',
      bg: 'rgba(232,121,138,0.14)',
      alert: true,
    },
  ]

  const acciones = [
    {
      href: '/admin/productos',
      label: 'Nuevo producto',
      desc: 'Agregar al catálogo',
      iconKey: 'plus' as const,
    },
    {
      href: '/admin/categorias',
      label: 'Nueva categoría',
      desc: 'Organizar la tienda',
      iconKey: 'tag' as const,
    },
    {
      href: '/admin/configuracion',
      label: 'Configuración',
      desc: 'Textos y ajustes',
      iconKey: 'settings' as const,
    },
  ]

  return (
    <DashboardView
      stats={stats}
      acciones={acciones}
      destacados={destacados ?? 0}
      agotados={agotados ?? 0}
      productosAgotados={productosAgotados ?? []}
      productosRecientes={productosRecientes ?? []}
      hoy={hoy}
    />
  )
}
