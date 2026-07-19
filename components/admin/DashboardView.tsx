'use client'

import Link from 'next/link'
import {
  Package,
  Tag,
  TrendingUp,
  AlertCircle,
  Star,
  Plus,
  Settings,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react'
import MobileDashboardView from '@/components/admin/mobile/MobileDashboardView'
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderRow,
  AdminTableTh,
  AdminTableBody,
  AdminTableRow,
  AdminTableTd,
  AdminTableImage,
  AdminTablePrimary,
  AdminTableCategory,
  AdminTableCategoryEmpty,
  AdminTablePrice,
  AdminTableStatus,
  AdminTableShell,
  AdminSectionTitle,
} from '@/components/admin/AdminTable'

type StatItem = {
  label: string
  value: number
  hint: string
  iconKey: 'package' | 'tag' | 'trending' | 'alert'
  accent: string
  bg: string
  alert?: boolean
  destacadosCount?: number
}

type AccionItem = {
  href: string
  label: string
  desc: string
  iconKey: 'plus' | 'tag' | 'settings'
}

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

type DashboardViewProps = {
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

function StatCard({ label, value, hint, iconKey, accent, bg, alert, destacadosCount }: StatItem) {
  const Icon = STAT_ICONS[iconKey]
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent-primary)_45%,var(--border))] hover:shadow-[var(--shadow-card-hover)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
        style={{ backgroundColor: bg }}
      />
      <div className="relative mb-5 flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundColor: bg,
            color: accent,
            borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%',
          }}
        >
          <Icon size={19} strokeWidth={2} />
        </div>
        {alert && value > 0 && (
          <span className="rounded-full border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--danger)]">
            Alerta
          </span>
        )}
      </div>
      <p className="relative mb-1 text-3xl font-bold leading-none tabular-nums text-[var(--text-primary)]" style={{ color: accent }}>
        {value}
      </p>
      <p className="relative text-[14px] font-bold text-[var(--text-primary)]">
        {label}
      </p>
      <p className="relative mt-1.5 text-[12px] font-medium text-[var(--text-muted)]">{hint}</p>
      {destacadosCount != null && destacadosCount > 0 && (
        <Link
          href="/admin/productos"
          className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-1 transition-colors hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border))]"
        >
          <Star size={10} className="fill-[var(--accent-secondary)] text-[var(--accent-secondary)]" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {destacadosCount} en inicio
          </span>
        </Link>
      )}
    </div>
  )
}

function resolveCategoria(
  raw: ProductoReciente['categoria'],
): { nombre: string } | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

const DASHBOARD_ROW_CLASS = 'flex h-[4.75rem] items-center gap-4 px-5'

export default function DashboardView({
  stats,
  acciones,
  destacados,
  agotados,
  productosAgotados,
  productosRecientes,
  hoy,
}: DashboardViewProps) {
  return (
    <>
    <MobileDashboardView
      stats={stats}
      acciones={acciones}
      destacados={destacados}
      agotados={agotados}
      productosAgotados={productosAgotados}
      productosRecientes={productosRecientes}
      hoy={hoy}
    />
    <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-5 border-b border-[rgba(232,136,181,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Panel
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 capitalize text-[14px] font-medium text-[var(--text-secondary)]">
            {hoy}
          </p>
          {destacados > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)]">
              <Star size={11} className="shrink-0 fill-[var(--accent-secondary)] text-[var(--accent-secondary)]" />
              {destacados} destacado{destacados !== 1 ? 's' : ''} en la página de inicio
            </p>
          )}
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[rgba(232,136,181,0.35)] bg-[rgba(232,136,181,0.08)] px-5 py-2.5 text-[11px] font-light tracking-normal text-[var(--accent-secondary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:border-[rgba(232,136,181,0.55)] hover:bg-[rgba(232,136,181,0.14)] hover:shadow-[0_4px_20px_rgba(232,136,181,0.12)] sm:self-auto"
        >
          <ExternalLink size={13} />
          Ver tienda
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <StatCard
            key={stat.label}
            {...stat}
            destacadosCount={stat.iconKey === 'package' ? destacados : undefined}
          />
        ))}
      </div>

      {/* Accesos + inventario */}
      <section>
        {/* Títulos alineados en desktop */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
          <div className="lg:col-span-2">
            <AdminSectionTitle title="Accesos rápidos" />
          </div>
          <div className="lg:col-span-3">
            <AdminSectionTitle
              title={agotados > 0 ? 'Productos agotados' : 'Estado del inventario'}
              action={
                agotados > 0 ? (
                  <Link
                    href="/admin/productos"
                    className="text-[11px] font-light uppercase tracking-[1px] text-[var(--accent-secondary)] transition-colors hover:text-[var(--accent-primary-hover)]"
                  >
                    Ver todos
                  </Link>
                ) : undefined
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5 lg:gap-6">
          {/* Accesos rápidos */}
          <div className="flex flex-col lg:col-span-2">
            <div className="lg:hidden">
              <AdminSectionTitle title="Accesos rápidos" />
            </div>
            <AdminTableShell className="h-[calc(3*4.75rem+2px)]">
              <div className="grid h-full grid-rows-3">
                {acciones.map(({ href, label, desc, iconKey }, i) => {
                  const Icon = ACCION_ICONS[iconKey]
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`group ${DASHBOARD_ROW_CLASS} transition-all hover:bg-[rgba(232,136,181,0.07)] hover:shadow-[inset_3px_0_0_var(--accent-secondary)] ${
                        i < acciones.length - 1 ? 'border-b border-[rgba(232,136,181,0.08)]' : ''
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(232,136,181,0.22)] bg-gradient-to-br from-[rgba(232,136,181,0.14)] to-[rgba(232,136,181,0.04)] ring-1 ring-[rgba(232,136,181,0.15)] transition-all group-hover:border-[rgba(232,136,181,0.4)] group-hover:shadow-[0_0_16px_rgba(232,136,181,0.15)]">
                        <Icon size={18} className="text-[var(--accent-secondary)]" strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-light uppercase tracking-[1px] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-secondary)]">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--text-muted)]">
                          {desc}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-[rgba(232,136,181,0.4)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--accent-secondary)]"
                      />
                    </Link>
                  )
                })}
              </div>
            </AdminTableShell>
          </div>

          {/* Inventario / agotados */}
          <div className="flex flex-col lg:col-span-3">
            <div className="lg:hidden">
              <AdminSectionTitle
                title={agotados > 0 ? 'Productos agotados' : 'Estado del inventario'}
                action={
                  agotados > 0 ? (
                    <Link
                      href="/admin/productos"
                      className="text-[11px] font-light uppercase tracking-[1px] text-[var(--accent-secondary)] transition-colors hover:text-[var(--accent-primary-hover)]"
                    >
                      Ver todos
                    </Link>
                  ) : undefined
                }
              />
            </div>
            <AdminTableShell className="h-[calc(3*4.75rem+2px)]">
              {productosAgotados.length > 0 ? (
                <div className="grid h-full grid-rows-3">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const p = productosAgotados[i]
                    if (!p) {
                      return (
                        <div
                          key={`empty-${i}`}
                          className={`${DASHBOARD_ROW_CLASS} ${
                            i < 2 ? 'border-b border-[rgba(232,136,181,0.08)]' : ''
                          }`}
                          aria-hidden
                        />
                      )
                    }
                    return (
                      <Link
                        key={p.id}
                        href="/admin/productos"
                        className={`group ${DASHBOARD_ROW_CLASS} transition-all hover:bg-[rgba(232,136,181,0.07)] hover:shadow-[inset_3px_0_0_var(--accent-secondary)] ${
                          i < 2 ? 'border-b border-[rgba(232,136,181,0.08)]' : ''
                        }`}
                      >
                        <AdminTableImage src={p.imagenes?.[0]} alt={p.nombre} size="row" />
                        <div className="min-w-0 flex-1">
                          <AdminTablePrimary title={p.nombre} />
                        </div>
                        <AdminTableStatus label="Agotado" icon={XCircle} variant="danger" />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 py-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 scale-150 rounded-full bg-[rgba(74,222,128,0.12)] blur-xl" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] shadow-[0_0_24px_rgba(74,222,128,0.12)]">
                      <Sparkles size={20} className="text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-[14px] font-light text-[var(--text-primary)]">
                    Todo el inventario está disponible
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-[var(--text-muted)]">
                    No hay productos agotados en este momento
                  </p>
                </div>
              )}
            </AdminTableShell>
          </div>
        </div>
      </section>

      {/* Productos recientes */}
      {productosRecientes.length > 0 && (
        <div className="mt-10">
          <AdminSectionTitle
            title="Agregados recientemente"
            action={
              <Link
                href="/admin/productos"
                className="text-[11px] font-light uppercase tracking-[1px] text-[var(--accent-secondary)] transition-colors hover:text-[var(--accent-primary-hover)]"
              >
                Gestionar productos
              </Link>
            }
          />
          <AdminTable minWidth="640px">
            <AdminTableHead>
              <AdminTableHeaderRow>
                <AdminTableTh>Producto</AdminTableTh>
                <AdminTableTh>Categoría</AdminTableTh>
                <AdminTableTh>Precio</AdminTableTh>
                <AdminTableTh>Estado</AdminTableTh>
              </AdminTableHeaderRow>
            </AdminTableHead>
            <AdminTableBody>
              {productosRecientes.map((p, i) => {
                const cat = resolveCategoria(p.categoria)
                return (
                  <AdminTableRow key={p.id} index={i} animated={false}>
                    <AdminTableTd>
                      <div className="flex items-center gap-3">
                        <AdminTableImage src={p.imagenes?.[0]} alt={p.nombre} size="sm" />
                        <AdminTablePrimary title={p.nombre} />
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
                      {cat ? (
                        <AdminTableCategory name={cat.nombre} />
                      ) : (
                        <AdminTableCategoryEmpty />
                      )}
                    </AdminTableTd>
                    <AdminTableTd>
                      <AdminTablePrice value={formatPrecio(p.precio)} tone="detal" />
                    </AdminTableTd>
                    <AdminTableTd>
                      <AdminTableStatus
                        label={p.disponible ? 'Disponible' : 'Agotado'}
                        icon={p.disponible ? CheckCircle2 : XCircle}
                        variant={p.disponible ? 'success' : 'danger'}
                      />
                    </AdminTableTd>
                  </AdminTableRow>
                )
              })}
            </AdminTableBody>
          </AdminTable>
        </div>
      )}
    </div>
    </>
  )
}
