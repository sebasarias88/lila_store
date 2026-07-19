'use client'

import { Menu } from 'lucide-react'
import { ReactNode } from 'react'

type MobileAdminHeaderProps = {
  title: string
  subtitle?: string
  onMenuOpen: () => void
  action?: ReactNode
}

export default function MobileAdminHeader({
  title,
  subtitle,
  onMenuOpen,
  action,
}: MobileAdminHeaderProps) {
  return (
    <header className="mobile-admin-header fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
      <div className="mobile-admin-bar">
        <div className="mobile-admin-bar-row">
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] active:bg-[var(--bg-muted)] active:text-[var(--accent-deep)]"
            aria-label="Abrir menú"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-[12px] font-medium text-[var(--text-secondary)]">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </header>
  )
}
