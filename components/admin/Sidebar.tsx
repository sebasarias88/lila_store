'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Heart, Loader2, LogOut } from 'lucide-react'
import { ADMIN_NAV_LINKS } from '@/lib/admin-nav'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="admin-sidebar fixed left-0 top-0 z-20 hidden h-[100dvh] w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] md:flex">
      <div className="shrink-0 border-b border-[var(--border)] px-5 py-6 [@media(max-height:760px)]:py-4">
        <div className="flex items-center gap-3">
          <span className="admin-blob-badge admin-blob-badge--sm">
            <Heart size={14} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--accent-deep)]">
              Administración
            </p>
            <p className="brand-wordmark truncate text-[18px] leading-tight text-[var(--text-primary)]">
              Lila-store
            </p>
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 [@media(max-height:760px)]:py-3">
        <div className="space-y-1">
          {ADMIN_NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-200 [@media(max-height:760px)]:py-2 ${
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

      <div className="shrink-0 border-t border-[var(--border)] px-3 py-5 [@media(max-height:760px)]:py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-busy={loggingOut || undefined}
          className="flex w-full items-center disabled:opacity-60 gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
        >
          {loggingOut ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <LogOut size={15} strokeWidth={2} />}
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
