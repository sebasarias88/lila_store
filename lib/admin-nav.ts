import {
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  ImageIcon,
  Tag,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavLink = {
  href: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/promociones', label: 'Promociones', icon: Tag },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Layers },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export function adminPageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/banners')) return 'Banners'
  if (pathname.startsWith('/admin/promociones')) return 'Promociones'
  if (pathname.startsWith('/admin/productos')) return 'Productos'
  if (pathname.startsWith('/admin/categorias')) return 'Categorías'
  if (pathname.startsWith('/admin/configuracion')) return 'Configuración'
  return 'Dashboard'
}
