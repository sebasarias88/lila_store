'use client'

import Link from 'next/link'
import {
  Package,
  Tag,
  TrendingUp,
  AlertCircle,
  Plus,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react'
import MobileStatCard from '@/components/admin/mobile/MobileStatCard'
import MobileQuickAction from '@/components/admin/mobile/MobileQuickAction'
import { MobileSectionTitle } from '@/components/admin/mobile/MobileAdminPrimitives'

const STAT_ICONS = {
  package: Package,
  tag: Tag,
  trending: TrendingUp,
  alert: AlertCircle,
} as const

const ACCION_ICONS = {
  plus: Plus,
  tag: Tag,
  settings: Settings,
} as const

type StatItem = {
  label: string
  value: number
  hint: string
  iconKey: keyof typeof STAT_ICONS
  accent: string
  bg: string
  alert?: boolean
}

type AccionItem = {
  href: string
  label: string
  desc: string
  iconKey: keyof typeof ACCION_ICONS
}

type ProductoAgotado = {
  id: string
  nombre: string
  slug: string
  imagenes: string[] | null
}

type ProductoReciente = {
  id: string
  nombre: string
  slug: string
  precio: number
  disponible: boolean
  imagenes: string[] | null
  categoria: { nombre: string } | { nombre: string }[] | null
}

type MobileDashboardViewProps = {
  stats: StatItem[]
  acciones: AccionItem[]
  destacados: number
  agotados: number
  productosAgotados: ProductoAgotado[]
  productosRecientes: ProductoReciente[]
  hoy: string
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

function resolveCategoria(raw: ProductoReciente['categoria']): { nombre: string } | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function MobileProductRow({
  nombre,
  imagen,
  badge,
  badgeTone,
  meta,
}: {
  nombre: string
  imagen?: string | null
  badge: string
  badgeTone: 'danger' | 'success'
  meta?: string
}) {
  const BadgeIcon = badgeTone === 'success' ? CheckCircle2 : XCircle
  return (
    <div className="flex items-center gap-3 border-b border-[rgba(232,136,181,0.1)] px-4 py-3 last:border-b-0">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[rgba(232,136,181,0.18)] bg-[var(--bg-muted)]">
        {imagen ? (
          <img src={imagen} alt={nombre} className="h-full w-full bg-white object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-light text-[var(--text-primary)]">{nombre}</p>
        {meta ? <p className="mt-0.5 truncate text-[10px] text-[var(--text-subtle)]">{meta}</p> : null}
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 text-[9px] uppercase tracking-[0.6px] ${
          badgeTone === 'success' ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        <BadgeIcon size={12} />
        {badge}
      </span>
    </div>
  )
}

export default function MobileDashboardView({
  stats,
  acciones,
  destacados,
  agotados,
  productosAgotados,
  productosRecientes,
  hoy,
}: MobileDashboardViewProps) {
  return (
    <div className="mobile-admin-page px-4 pb-10 md:hidden">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-normal text-[rgba(232,136,181,0.82)]">Panel</p>
          <p className="mt-1 capitalize text-[12px] font-light text-[var(--text-muted)]">{hoy}</p>
          {destacados > 0 ? (
            <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
              {destacados} destacado{destacados !== 1 ? 's' : ''} en inicio
            </p>
          ) : null}
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[rgba(232,136,181,0.35)] px-3 py-2 text-[10px] uppercase tracking-[0.8px] text-[var(--accent-primary)]"
        >
          <ExternalLink size={12} />
          Tienda
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {stats.map(stat => {
          const Icon = STAT_ICONS[stat.iconKey]
          return (
            <MobileStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              icon={Icon}
              accent={stat.accent}
              bg={stat.bg}
              alert={stat.alert}
              destacadosLink={stat.iconKey === 'package' ? destacados : undefined}
            />
          )
        })}
      </div>

      <MobileSectionTitle title="Accesos rápidos" />
      <div className="mobile-admin-panel mb-6 overflow-hidden rounded-xl border border-[rgba(232,136,181,0.22)] bg-[var(--bg-card)]">
        {acciones.map(({ href, label, desc, iconKey }) => {
          const Icon = ACCION_ICONS[iconKey]
          return (
            <MobileQuickAction
              key={href}
              href={href}
              label={label}
              description={desc}
              icon={Icon}
            />
          )
        })}
      </div>

      <MobileSectionTitle
        title={agotados > 0 ? 'Productos agotados' : 'Inventario'}
        action={
          agotados > 0 ? (
            <Link href="/admin/productos" className="text-[10px] uppercase tracking-[0.8px] text-[var(--accent-primary)]">
              Ver todos
            </Link>
          ) : undefined
        }
      />
      <div className="mobile-admin-panel mb-6 overflow-hidden rounded-xl border border-[rgba(232,136,181,0.22)] bg-[var(--bg-card)]">
        {productosAgotados.length > 0 ? (
          productosAgotados.map(p => (
            <Link key={p.id} href="/admin/productos">
              <MobileProductRow
                nombre={p.nombre}
                imagen={p.imagenes?.[0]}
                badge="Agotado"
                badgeTone="danger"
              />
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <p className="text-[13px] font-light text-[var(--text-primary)]">Inventario al día</p>
            <p className="mt-1 text-[11px] text-[var(--text-subtle)]">No hay productos agotados</p>
          </div>
        )}
      </div>

      {productosRecientes.length > 0 ? (
        <>
          <MobileSectionTitle
            title="Recientes"
            action={
              <Link href="/admin/productos" className="text-[10px] uppercase tracking-[0.8px] text-[var(--accent-primary)]">
                Ver todos
              </Link>
            }
          />
          <div className="mobile-admin-panel overflow-hidden rounded-xl border border-[rgba(232,136,181,0.22)] bg-[var(--bg-card)]">
            {productosRecientes.map(p => {
              const cat = resolveCategoria(p.categoria)
              return (
                <MobileProductRow
                  key={p.id}
                  nombre={p.nombre}
                  imagen={p.imagenes?.[0]}
                  badge={p.disponible ? 'Disponible' : 'Agotado'}
                  badgeTone={p.disponible ? 'success' : 'danger'}
                  meta={[cat?.nombre, formatPrecio(p.precio)].filter(Boolean).join(' · ')}
                />
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
