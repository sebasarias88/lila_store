'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, LogOut, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ADMIN_NAV_LINKS } from '@/lib/admin-nav'

type MobileNavigationProps = {
  open: boolean
  onClose: () => void
}

export default function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onClose()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-[60] bg-[rgba(58,46,61,0.45)] backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="mobile-admin-nav fixed left-0 top-0 z-[70] flex h-[100dvh] w-[min(100%,18.5rem)] flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div className="mobile-admin-bar border-b border-[var(--border)]">
              <div className="mobile-admin-bar-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="admin-blob-badge admin-blob-badge--sm">
                    <Heart size={14} fill="currentColor" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--accent-deep)]">Admin</p>
                    <p className="brand-wordmark text-[17px] text-[var(--text-primary)]">lila-store</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] active:bg-[var(--bg-muted)]"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {ADMIN_NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`mb-1 flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-[14px] font-semibold ${
                      active
                        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_35%,var(--border))]'
                        : 'text-[var(--text-secondary)] active:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.25 : 2} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-[var(--border)] px-4 py-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-2 text-[14px] font-semibold text-[var(--text-secondary)] active:text-[var(--danger)]"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
