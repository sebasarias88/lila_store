'use client'

import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

type MobileSectionTitleProps = {
  title: string
  action?: ReactNode
}

export function MobileSectionTitle({ title, action }: MobileSectionTitleProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[10px] font-medium tracking-normal text-[var(--accent-primary)]">{title}</h2>
      {action}
    </div>
  )
}

type MobileEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function MobileEmptyState({ icon: Icon, title, description, action }: MobileEmptyStateProps) {
  return (
    <div className="mobile-admin-empty flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(169,137,224,0.22)] bg-[var(--bg-card)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(169,137,224,0.22)] bg-[rgba(169,137,224,0.08)]">
        <Icon size={20} className="text-[var(--accent-primary)]" strokeWidth={1.5} />
      </div>
      <p className="text-[13px] font-light text-[var(--text-primary)]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-[16rem] text-[12px] font-medium text-[var(--text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
