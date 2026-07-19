'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Heart, LogOut } from 'lucide-react'
import { ADMIN_NAV_LINKS } from '@/lib/admin-nav'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="admin-sidebar fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] md:flex">
      <div className="border-b border-[var(--border)] px-5 py-6">
        <div className="flex items-center gap-3">
          <span className="admin-blob-badge admin-blob-badge--sm">
            <Heart size={14} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--accent-deep)]">
              Administración
            </p>
            <p className="brand-wordmark truncate text-[18px] leading-tight text-[var(--text-primary)]">
              lila-store
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col px-3 py-5">
        <div className="space-y-1">
          {ADMIN_NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_35%,var(--border))]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center ${
                    active
                      ? 'admin-blob-badge admin-blob-badge--sm bg-[var(--accent-primary)] text-white border-transparent'
                      : 'rounded-xl bg-[var(--bg-muted)] text-[var(--accent-secondary)]'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.25 : 2} />
                </span>
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-[var(--border)] px-3 py-5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
        >
          <LogOut size={15} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
