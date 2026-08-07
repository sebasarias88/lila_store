'use client'

import Link from 'next/link'
import { LucideIcon, Star } from 'lucide-react'

type MobileStatCardProps = {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  accent: string
  bg: string
  alert?: boolean
  destacadosLink?: number
}

export default function MobileStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  bg,
  alert,
  destacadosLink,
}: MobileStatCardProps) {
  return (
    <div className="mobile-admin-stat flex min-h-[5.5rem] flex-col justify-between rounded-xl border border-[rgba(169,137,224,0.16)] bg-[var(--bg-card)] p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: bg }}
        >
          <Icon size={15} style={{ color: accent }} strokeWidth={1.5} />
        </div>
        {alert && value > 0 ? (
          <span className="rounded-full border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.6px] text-red-400">
            !
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 min-w-0">
        <p className="text-[1.625rem] font-light leading-none tabular-nums" style={{ color: accent }}>
          {value}
        </p>
        <p className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-[0.8px] text-[var(--text-primary)]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[9px] font-light text-[var(--text-subtle)]">{hint}</p>
        {destacadosLink != null && destacadosLink > 0 ? (
          <Link
            href="/admin/productos"
            className="mt-1.5 inline-flex max-w-full items-center gap-1 text-[8px] text-[var(--text-muted)]"
          >
            <Star size={8} className="shrink-0 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
            <span className="truncate">{destacadosLink} en inicio</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
