'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Cloud,
  Database,
  Download,
  ExternalLink,
  HardDrive,
  ImageOff,
  Info,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserX,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AdminLoadError from '@/components/admin/AdminLoadError'
import { STORAGE_LIMITS, USAGE_LINKS, formatBytes } from '@/lib/storageLimits'

type Usage = {
  database_bytes: number
  buckets: { bucket: string; files: number; bytes: number }[]
  tables: { name: string; bytes: number; rows: number }[]
  oldest_finished_order: string | null
}
type Preview = {
  orders: number
  receipts: { files: number; bytes: number }
  legacy_images: { files: number; bytes: number }
  legacy_references: number
}
type R2 = {
  files: number
  bytes: number
  folders: { name: string; files: number; bytes: number }[]
  orphans: { files: number; bytes: number }
} | null
type Data = { usage: Usage; preview: Preview; r2: R2; cutoff: string; months: number }

type Action = 'orders' | 'receipts' | 'r2_orphans' | 'legacy_images'

const TABLE_LABELS: Record<string, string> = {
  productos: 'Productos',
  producto_secciones: 'Secciones de información de productos',
  variacion_opciones: 'Opciones de variaciones',
  categorias: 'Categorías',
  orders: 'Pedidos',
  order_items: 'Productos de los pedidos',
  payment_events: 'Registros de pagos en línea',
  order_status_history: 'Historial de estados de pedidos',
}
const BUCKET_LABELS: Record<string, string> = {
  productos: 'Imágenes antiguas de productos (ya copiadas a R2)',
  banners: 'Imágenes antiguas de banners (ya copiadas a R2)',
  'comprobantes-pago': 'Comprobantes de pago',
}

const shiftDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

function Meter({ label, icon: Icon, used, limit, hint }: { label: string; icon: typeof Database; used: number; limit: number; hint?: string }) {
  const pct = Math.min(100, (used / limit) * 100)
  const tone = pct > 85 ? 'bg-[#E8798A]' : pct > 65 ? 'bg-[var(--accent-secondary)]' : 'bg-[var(--accent-primary)]'
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-extrabold text-[var(--text-primary)]">
          <Icon size={15} className="text-[var(--accent-primary)]" aria-hidden /> {label}
        </p>
        <p className="text-[11px] font-bold text-[var(--text-muted)]">
          {formatBytes(used)} de {formatBytes(limit)}
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-muted)]" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(1.5, pct)}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-[var(--text-secondary)]">
        {pct < 0.1 ? 'Menos de 0,1' : pct.toFixed(1).replace('.', ',')}% usado{hint ? ` · ${hint}` : ''}
        {pct > 80 ? ' · Es momento de limpiar.' : ''}
      </p>
    </div>
  )
}

function CleanupCard({
  icon: Icon,
  title,
  description,
  amount,
  children,
}: {
  icon: typeof Trash2
  title: string
  description: React.ReactNode
  amount: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--text-primary)]">
          <Icon size={16} className="text-[var(--accent-primary)]" aria-hidden /> {title}
        </p>
        <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-deep)]">{amount}</span>
      </div>
      <div className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{description}</div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function AlmacenamientoPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cutoff, setCutoff] = useState(shiftDays(-730))
  const [months, setMonths] = useState(12)
  const [exported, setExported] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [pending, setPending] = useState<Action | null>(null)
  const [ask, setAsk] = useState<Action | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/storage?cutoff=${cutoff}&months=${months}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      setData((await res.json()) as Data)
      setError(false)
    } catch {
      setError(true)
    }
    setLoading(false)
  }, [cutoff, months])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (action: Action) => {
    setPending(action)
    try {
      const res = await fetch('/api/admin/storage/cleanup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, cutoff, months, confirm: confirmText }),
      })
      const body = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (body?.ok) {
        toast.success(body.message ?? 'Listo', { duration: 6000 })
        setConfirmText('')
        setExported(null)
        setAsk(null)
        await load()
      } else {
        toast.error(body?.message ?? 'No se pudo limpiar.')
      }
    } catch {
      toast.error('Sin conexión. Intenta de nuevo.')
    }
    setPending(null)
  }

  const supabaseStorage = data?.usage.buckets.reduce((a, b) => a + Number(b.bytes), 0) ?? 0
  const p = data?.preview
  const exportHref = `/api/admin/orders/export?before=${cutoff}&scope=finished`

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-3.5 py-4 sm:p-8 lg:p-10">
      <header className="mb-5 flex flex-col gap-3 border-b border-[rgba(169,137,224,0.16)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-bold text-[var(--accent-deep)]">Sistema</p>
          <h1 className="mt-1 text-[22px] font-extrabold text-[var(--text-primary)] sm:text-[26px]">Almacenamiento</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
            La tienda funciona con los planes gratuitos de Supabase (datos) y Cloudflare R2 (imágenes y videos).
            Aquí ves cuánto se usa y puedes liberar espacio sin tocar productos, categorías ni banners.
          </p>
        </div>
        <Button variant="outline" size="sm" loading={loading && data !== null} onClick={() => void load()}>
          <RefreshCw size={13} /> Actualizar
        </Button>
      </header>

      {error ? (
        <AdminLoadError onRetry={() => void load()} />
      ) : !data ? (
        <div className="space-y-3" aria-busy="true">
          <span role="status" className="sr-only">Cargando almacenamiento…</span>
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map(i => <div key={i} className="h-[112px] animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)]" />)}
          </div>
          <div className="h-[220px] animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)]" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-3" aria-label="Uso de los planes gratuitos">
            <Meter label="Base de datos (Supabase)" icon={Database} used={data.usage.database_bytes} limit={STORAGE_LIMITS.supabaseDatabase} hint="productos, pedidos, configuración" />
            <Meter label="Archivos (Supabase)" icon={HardDrive} used={supabaseStorage} limit={STORAGE_LIMITS.supabaseStorage} hint="comprobantes e imágenes antiguas" />
            {data.r2 ? (
              <Meter label="Imágenes y videos (R2)" icon={Cloud} used={data.r2.bytes} limit={STORAGE_LIMITS.r2Storage} hint={`${data.r2.files.toLocaleString('es-CO')} archivos`} />
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--border)] p-4 text-[12px] text-[var(--text-muted)]">No se pudo leer el uso de R2 ahora.</div>
            )}
          </section>

          <section className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            <p className="flex items-center gap-2 text-[13px] font-extrabold text-[var(--text-primary)]">
              <Info size={15} className="text-[var(--accent-primary)]" aria-hidden /> ¿Y el tráfico mensual?
            </p>
            <p className="mt-1.5">
              Además del espacio, Supabase permite {formatBytes(STORAGE_LIMITS.supabaseEgress)} de tráfico al mes (datos que salen hacia
              la tienda). Desde que las imágenes se sirven por Cloudflare, la tienda gasta muy poco de ese tráfico: el catálogo se
              guarda en caché y el panel solo consulta lo que se muestra en pantalla. Ese dato no se puede leer desde aquí; si
              quieres verlo, entra a:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={USAGE_LINKS.supabase} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 font-bold text-[var(--accent-deep)]">
                Uso en Supabase <ExternalLink size={11} />
              </a>
              <a href={USAGE_LINKS.cloudflare} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 font-bold text-[var(--accent-deep)]">
                Uso en Cloudflare R2 <ExternalLink size={11} />
              </a>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-extrabold text-[var(--text-primary)]">¿Qué ocupa espacio?</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <ul className="divide-y divide-[var(--border)] rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] px-4">
                {data.usage.tables.map(t => (
                  <li key={t.name} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                    <span className="min-w-0 font-semibold text-[var(--text-secondary)]">
                      {TABLE_LABELS[t.name] ?? t.name}
                      <span className="ml-1 text-[var(--text-faint)]">· {Number(t.rows).toLocaleString('es-CO')}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[var(--text-primary)]">{formatBytes(Number(t.bytes))}</span>
                  </li>
                ))}
              </ul>
              <ul className="divide-y divide-[var(--border)] rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] px-4">
                {data.usage.buckets.map(b => (
                  <li key={b.bucket} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                    <span className="min-w-0 font-semibold text-[var(--text-secondary)]">
                      {BUCKET_LABELS[b.bucket] ?? b.bucket}
                      <span className="ml-1 text-[var(--text-faint)]">· {Number(b.files).toLocaleString('es-CO')}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[var(--text-primary)]">{formatBytes(Number(b.bytes))}</span>
                  </li>
                ))}
                {data.r2?.folders.map(f => (
                  <li key={`r2-${f.name}`} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                    <span className="min-w-0 font-semibold text-[var(--text-secondary)]">
                      R2 · {f.name}
                      <span className="ml-1 text-[var(--text-faint)]">· {f.files.toLocaleString('es-CO')}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[var(--text-primary)]">{formatBytes(f.bytes)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-[15px] font-extrabold text-[var(--text-primary)]">Liberar espacio</h2>
            <p className="mb-3 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <ShieldCheck size={13} className="text-[var(--accent-primary)]" aria-hidden />
              Nunca se borran productos, categorías, banners, configuración ni pedidos abiertos.
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              <CleanupCard
                icon={UserX}
                title="Datos personales de pedidos viejos"
                amount={`${p?.orders ?? 0} pedidos`}
                description={
                  <>
                    Borra nombre, celular, documento, dirección, datos de factura y comprobante de los pedidos <b>entregados o
                    cancelados</b> antes de la fecha. Se conservan los productos y montos para tus reportes. La política de
                    privacidad promete hacerlo a más tardar a los 2 años.
                  </>
                }
              >
                <div className="space-y-2.5">
                  <label className="block text-[12px] font-bold text-[var(--text-muted)]">
                    Pedidos anteriores a
                    <input
                      type="date"
                      value={cutoff}
                      max={shiftDays(-31)}
                      onChange={e => {
                        setCutoff(e.target.value)
                        setExported(null)
                      }}
                      className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-[13px] text-[var(--text-primary)]"
                    />
                  </label>
                  <a
                    href={exportHref}
                    onClick={() => setExported(cutoff)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2.5 text-[12px] font-bold text-[var(--accent-deep)] hover:border-[var(--accent-primary)]"
                  >
                    <Download size={13} /> 1. Descargar respaldo (Excel)
                  </a>
                  <Button
                    fullWidth
                    variant="danger"
                    disabled={!p?.orders || exported !== cutoff || pending !== null}
                    onClick={() => setAsk('orders')}
                  >
                    <Trash2 size={13} /> 2. Borrar datos personales
                  </Button>
                  {p?.orders && exported !== cutoff ? (
                    <p className="text-[11px] text-[var(--text-muted)]">Primero descarga el respaldo y guárdalo en un lugar seguro.</p>
                  ) : null}
                </div>
              </CleanupCard>

              <CleanupCard
                icon={Receipt}
                title="Comprobantes de pago viejos"
                amount={`${p?.receipts.files ?? 0} · ${formatBytes(p?.receipts.bytes ?? 0)}`}
                description="Imágenes de transferencias que los clientes adjuntaron. Los de pedidos abiertos nunca se borran."
              >
                <div className="mb-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Antigüedad">
                  {[6, 12, 24].map(m => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={months === m}
                      onClick={() => setMonths(m)}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                        months === m ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]' : 'border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      Más de {m} meses
                    </button>
                  ))}
                </div>
                <Button fullWidth variant="outline" disabled={!p?.receipts.files || pending !== null} onClick={() => setAsk('receipts')}>
                  <Trash2 size={13} /> Borrar comprobantes viejos
                </Button>
              </CleanupCard>

              <CleanupCard
                icon={ImageOff}
                title="Imágenes y videos sin usar (R2)"
                amount={data.r2 ? `${data.r2.orphans.files} · ${formatBytes(data.r2.orphans.bytes)}` : '—'}
                description="Archivos que ya ningún producto, categoría, banner ni anuncio usa (por ejemplo fotos reemplazadas). Solo cuenta los que tienen más de 7 días."
              >
                <Button fullWidth variant="outline" disabled={!data.r2?.orphans.files || pending !== null} onClick={() => setAsk('r2_orphans')}>
                  <Trash2 size={13} /> Borrar archivos sin usar
                </Button>
              </CleanupCard>

              <CleanupCard
                icon={HardDrive}
                title="Imágenes antiguas en Supabase"
                amount={`${p?.legacy_images.files ?? 0} · ${formatBytes(p?.legacy_images.bytes ?? 0)}`}
                description={
                  p?.legacy_references
                    ? `Todavía hay ${p.legacy_references} registros que usan estas imágenes: por seguridad no se pueden borrar.`
                    : 'Copias de las fotos de antes de pasar a Cloudflare R2. La tienda ya no las usa (verificado): borrarlas libera espacio del plan gratuito.'
                }
              >
                <Button
                  fullWidth
                  variant="outline"
                  disabled={!p?.legacy_images.files || Boolean(p?.legacy_references) || pending !== null}
                  onClick={() => setAsk('legacy_images')}
                >
                  <Trash2 size={13} /> Borrar imágenes antiguas
                </Button>
              </CleanupCard>
            </div>
          </section>
        </div>
      )}

      <Modal open={ask !== null} onClose={() => (pending ? undefined : setAsk(null))} title="Confirmar limpieza" size="sm">
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {ask === 'orders'
              ? `Se borrarán los datos personales de ${p?.orders ?? 0} pedidos terminados antes del ${cutoff}. No se puede deshacer.`
              : ask === 'receipts'
                ? `Se borrarán ${p?.receipts.files ?? 0} comprobantes de hace más de ${months} meses. No se puede deshacer.`
                : ask === 'r2_orphans'
                  ? `Se borrarán ${data?.r2?.orphans.files ?? 0} archivos que la tienda ya no usa. No se puede deshacer.`
                  : `Se borrarán ${p?.legacy_images.files ?? 0} copias antiguas de imágenes en Supabase. La tienda sigue usando las de Cloudflare R2.`}
          </p>
          {ask === 'orders' ? (
            <label className="block text-[12px] font-bold text-[var(--text-muted)]">
              Escribe LIMPIAR para confirmar
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                autoComplete="off"
                className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-[13px] uppercase"
                placeholder="LIMPIAR"
              />
            </label>
          ) : null}
          <div className="flex gap-3">
            <Button variant="outline" fullWidth disabled={pending !== null} onClick={() => setAsk(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={pending !== null}
              disabled={ask === 'orders' && confirmText.trim().toUpperCase() !== 'LIMPIAR'}
              onClick={() => ask && void run(ask)}
            >
              Sí, borrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
