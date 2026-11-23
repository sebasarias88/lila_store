'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, ShoppingBag, Store, Truck, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrecio } from '@/lib/catalog'
import { orderCode, type OrderStatus } from '@/lib/orders/shared'
import {
  ORDER_LIST_COLUMNS,
  customerWhatsAppDigits,
  formatOrderDate,
  type OrderRow,
} from '@/lib/orders/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/orders/OrderBadges'
import { AdminTablePagination } from '@/components/admin/AdminTable'
import AdminLoadError from '@/components/admin/AdminLoadError'

const PAGE_SIZE = 20

type Filter = 'todos' | 'pendientes' | 'por_enviar' | 'enviados' | 'entregados' | 'cancelados'

const FILTERS: { id: Filter; label: string; statuses: OrderStatus[] | null }[] = [
  { id: 'todos', label: 'Todos', statuses: null },
  { id: 'pendientes', label: 'Pendientes', statuses: ['pending', 'awaiting_payment'] },
  { id: 'por_enviar', label: 'Por preparar', statuses: ['paid', 'preparing'] },
  { id: 'enviados', label: 'Enviados', statuses: ['shipped'] },
  { id: 'entregados', label: 'Entregados', statuses: ['delivered'] },
  { id: 'cancelados', label: 'Cancelados', statuses: ['cancelled'] },
]

type Stats = {
  today_orders: number
  today_sales: number
  month_orders: number
  month_sales: number
  open_orders: number
  to_ship: number
}

type ListRow = Pick<
  OrderRow,
  | 'id' | 'order_number' | 'catalog' | 'status' | 'payment_method' | 'payment_kind' | 'payment_status'
  | 'customer_name' | 'customer_phone' | 'document_number' | 'delivery_type' | 'city' | 'pickup_branch'
  | 'total' | 'has_unpriced_items' | 'wants_invoice' | 'tracking_number' | 'created_at'
>

/** Characters that would break PostgREST's or() syntax are removed. */
function cleanTerm(term: string) {
  return term.replace(/[%,()*\\'"]/g, ' ').trim().slice(0, 60)
}

export default function PedidosPage() {
  const [filter, setFilter] = useState<Filter>('todos')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ListRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => setPage(1), [filter, debounced])

  const load = useCallback(async () => {
    setRows(null)
    const from = (page - 1) * PAGE_SIZE
    let q = supabase
      .from('orders')
      .select(ORDER_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    const statuses = FILTERS.find(f => f.id === filter)?.statuses
    if (statuses) q = q.in('status', statuses)

    const term = cleanTerm(debounced)
    if (term) {
      const code = term.toUpperCase().replace(/^LILA-?/, '')
      if (/^\d+$/.test(code)) {
        const parts = [`customer_phone.ilike.%${code}%`, `document_number.ilike.%${code}%`]
        if (code.length <= 9) parts.unshift(`order_number.eq.${code}`)
        q = q.or(parts.join(','))
      } else {
        q = q.ilike('customer_name', `%${term}%`)
      }
    }

    const { data, error, count } = await q
    if (error) {
      console.error('[admin/pedidos]', error)
      setLoadError(true)
      setRows([])
      return
    }
    setLoadError(false)
    setRows((data ?? []) as unknown as ListRow[])
    setTotal(count ?? 0)
  }, [page, filter, debounced])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    supabase.rpc('admin_order_stats').then(({ data }: { data: unknown }) => {
      if (data) setStats(data as Stats)
    })
  }, [])

  const statCards = useMemo(
    () => [
      { label: 'Pedidos hoy', value: stats ? String(stats.today_orders) : null, hint: stats ? formatPrecio(stats.today_sales) : '' },
      { label: 'Pedidos este mes', value: stats ? String(stats.month_orders) : null, hint: stats ? formatPrecio(stats.month_sales) : '' },
      { label: 'Abiertos', value: stats ? String(stats.open_orders) : null, hint: 'Sin terminar' },
      { label: 'Por preparar / enviar', value: stats ? String(stats.to_ship) : null, hint: 'Ya pagados' },
    ],
    [stats],
  )

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-5 sm:p-8 lg:p-10">
      <header className="mb-6 border-b border-[rgba(169,137,224,0.16)] pb-6">
        <p className="text-[12px] font-bold text-[var(--accent-deep)]">Ventas</p>
        <h1 className="mt-1 text-[26px] font-extrabold text-[var(--text-primary)]">Pedidos</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
          Todos los pedidos de la tienda. Entra a cada uno para ver el detalle, cambiar el estado,
          registrar la guía de envío y escribirle al cliente por WhatsApp.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen">
        {statCards.map(card => (
          <div key={card.label} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold text-[var(--text-muted)]">{card.label}</p>
            {card.value === null ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
            ) : (
              <p className="mt-1 text-[24px] font-extrabold text-[var(--text-primary)]">{card.value}</p>
            )}
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[var(--accent-deep)]">{card.hint}</p>
          </div>
        ))}
      </section>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número de pedido, nombre, celular o documento…"
            className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-9 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0" role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors ${
                filter === f.id
                  ? 'border-[var(--accent-primary)] bg-[rgba(169,137,224,0.12)] text-[var(--accent-deep)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--accent-primary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <AdminLoadError onRetry={() => void load()} />
      ) : rows === null ? (
        <ul className="space-y-3" aria-busy="true">
          <span role="status" className="sr-only">Cargando pedidos…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-[84px] animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)]" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center">
          <ShoppingBag className="mx-auto text-[var(--accent-primary)]" aria-hidden />
          <p className="mt-3 text-[14px] font-bold text-[var(--text-primary)]">
            {debounced || filter !== 'todos' ? 'No hay pedidos con esos filtros' : 'Aún no hay pedidos'}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {debounced || filter !== 'todos'
              ? 'Prueba con otro filtro o búsqueda.'
              : 'Cuando un cliente envíe su pedido desde el carrito, aparecerá aquí.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map(o => {
              const wa = customerWhatsAppDigits(o.customer_phone)
              return (
                <li key={o.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--accent-primary)]">
                  <div className="flex items-center gap-3 p-3.5 sm:p-4">
                    <Link href={`/admin/pedidos/${o.id}`} className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[9rem_minmax(0,1fr)_9rem_auto] md:items-center md:gap-4">
                      <div className="min-w-0">
                        <p className="text-[14px] font-extrabold text-[var(--accent-deep)]">{orderCode(o.order_number)}</p>
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">{formatOrderDate(o.created_at)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                          {o.customer_name || 'Datos eliminados'}
                          {o.catalog === 'mayoreo' ? (
                            <span className="ml-2 rounded-full bg-[rgba(96,165,250,0.12)] px-2 py-0.5 text-[10px] font-bold text-blue-500">Mayorista</span>
                          ) : null}
                        </p>
                        <p className="flex items-center gap-1.5 truncate text-[12px] text-[var(--text-secondary)]">
                          {o.delivery_type === 'recogida' ? <Store size={12} aria-hidden /> : <Truck size={12} aria-hidden />}
                          {o.delivery_type === 'recogida' ? 'Recoge en tienda' : o.city || '—'}
                          <span className="text-[var(--text-faint)]">·</span>
                          {o.payment_method}
                        </p>
                      </div>
                      <p className="text-[14px] font-extrabold text-[var(--text-primary)] md:text-right">
                        {formatPrecio(Number(o.total))}
                        {o.has_unpriced_items ? <span className="block text-[10px] font-bold text-amber-500">+ precio por confirmar</span> : null}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={o.status} />
                        {o.status !== 'cancelled' ? <PaymentStatusBadge status={o.payment_status} /> : null}
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      {wa ? (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Escribir por WhatsApp a ${o.customer_name ?? 'cliente'}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.46 3.49A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.42z" /></svg>
                        </a>
                      ) : null}
                      <Link href={`/admin/pedidos/${o.id}`} aria-label="Ver pedido" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--accent-deep)]">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4">
            <AdminTablePagination page={page} pageSize={PAGE_SIZE} totalItems={total} onPageChange={setPage} compact />
          </div>
        </>
      )}
    </div>
  )
}
