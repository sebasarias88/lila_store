'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { MetodoPago } from '@/types'
import { type CatalogType } from '@/lib/catalog'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderRow,
  AdminTableTh,
  AdminTableBody,
  AdminTableTd,
  AdminTableEmpty,
  AdminTableSkeletonRow,
  AdminTableActions,
} from '@/components/admin/AdminTable'
import AdminLoadError from '@/components/admin/AdminLoadError'
import toast from 'react-hot-toast'
import {
  CreditCard,
  Plus,
  ChevronUp,
  ChevronDown,
  Info,
  Store,
  Percent,
  Sparkles,
} from 'lucide-react'
import { formatPorcentajeRecargo } from '@/lib/payment-methods'

type FormState = {
  nombre: string
  recargo_detal_porcentaje: string
  recargo_mayoreo_porcentaje: string
  mostrar_detal: boolean
  mostrar_mayoreo: boolean
  orden: number
  activo: boolean
}

const emptyForm = (orden = 1): FormState => ({
  nombre: '',
  recargo_detal_porcentaje: '0',
  recargo_mayoreo_porcentaje: '0',
  mostrar_detal: true,
  mostrar_mayoreo: true,
  orden,
  activo: true,
})

function parsePorcentaje(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return 0
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function metodoIconLabel(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '•'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function RecargoPill({ value }: { value: number }) {
  const n = Number(value) || 0
  const hasRecargo = n > 0
  return (
    <span
      className={`inline-flex min-w-[3.25rem] items-center justify-center rounded-full border px-2.5 py-1 text-[12px] font-bold tabular-nums ${
        hasRecargo
          ? 'border-[rgba(232,160,200,0.4)] bg-[rgba(232,160,200,0.14)] text-[var(--accent-deep)]'
          : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-subtle)]'
      }`}
    >
      {formatPorcentajeRecargo(n)}%
    </span>
  )
}

function CatalogPills({
  detal,
  mayoreo,
}: {
  detal: boolean
  mayoreo: boolean
}) {
  if (!detal && !mayoreo) {
    return (
      <span className="text-[11px] italic text-[var(--text-faint)]">Sin catálogo</span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {detal ? (
        <span className="inline-flex rounded-full border border-[rgba(169,137,224,0.35)] bg-[rgba(169,137,224,0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--accent-deep)]">
          Detal
        </span>
      ) : null}
      {mayoreo ? (
        <span className="inline-flex rounded-full border border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-blue-500">
          Mayorista
        </span>
      ) : null}
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="admin-form-section-title">{title}</p>
        {description ? (
          <p className="admin-form-hint mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export default function MetodosPagoPage() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<MetodoPago | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filtroCatalogo, setFiltroCatalogo] = useState<'todos' | CatalogType>('todos')

  const metodosVisibles = useMemo(() => {
    if (filtroCatalogo === 'todos') return metodos
    if (filtroCatalogo === 'detal') {
      return metodos.filter(m => m.mostrar_detal ?? true)
    }
    return metodos.filter(m => m.mostrar_mayoreo ?? true)
  }, [metodos, filtroCatalogo])

  const fetchMetodos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('metodos_pago')
      .select('*')
      .order('orden', { ascending: true })

    if (error) {
      console.error('[admin] metodos_pago:', error)
      toast.error('Error al cargar métodos de pago')
      setLoadError(true)
      setMetodos([])
    } else {
      setMetodos((data as MetodoPago[]) || [])
      setLoadError(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchMetodos()
  }, [fetchMetodos])

  const abrirCrear = () => {
    setSelected(null)
    const nextOrden =
      metodos.length > 0 ? Math.max(...metodos.map(m => m.orden)) + 1 : 1
    setForm(emptyForm(nextOrden))
    setModalOpen(true)
  }

  const abrirEditar = (metodo: MetodoPago) => {
    setSelected(metodo)
    setForm({
      nombre: metodo.nombre,
      recargo_detal_porcentaje: String(metodo.recargo_detal_porcentaje ?? 0),
      recargo_mayoreo_porcentaje: String(metodo.recargo_mayoreo_porcentaje ?? 0),
      mostrar_detal: metodo.mostrar_detal ?? true,
      mostrar_mayoreo: metodo.mostrar_mayoreo ?? true,
      orden: metodo.orden,
      activo: metodo.activo,
    })
    setModalOpen(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!form.mostrar_detal && !form.mostrar_mayoreo) {
      toast.error('Activa al menos un catálogo (detal o mayorista)')
      return
    }
    const detal = parsePorcentaje(form.recargo_detal_porcentaje)
    const mayoreo = parsePorcentaje(form.recargo_mayoreo_porcentaje)
    if (detal === null || mayoreo === null) {
      toast.error('Los porcentajes deben ser números ≥ 0')
      return
    }

    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      recargo_detal_porcentaje: detal,
      recargo_mayoreo_porcentaje: mayoreo,
      mostrar_detal: form.mostrar_detal,
      mostrar_mayoreo: form.mostrar_mayoreo,
      orden: Number(form.orden) || 0,
      activo: form.activo,
    }

    const { error } = selected
      ? await supabase.from('metodos_pago').update(payload).eq('id', selected.id)
      : await supabase.from('metodos_pago').insert(payload)

    if (error) {
      console.error('[admin] guardar metodo_pago:', error)
      toast.error('Error al guardar el método de pago')
    } else {
      toast.success(selected ? 'Método actualizado' : 'Método creado')
      setModalOpen(false)
      void fetchMetodos()
    }
    setSaving(false)
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase
      .from('metodos_pago')
      .delete()
      .eq('id', selected.id)
    if (error) toast.error('Error al eliminar')
    else {
      toast.success('Método eliminado')
      setDeleteModal(false)
      setSelected(null)
      void fetchMetodos()
    }
    setDeleting(false)
  }

  const toggleActivo = async (metodo: MetodoPago) => {
    const { error } = await supabase
      .from('metodos_pago')
      .update({ activo: !metodo.activo })
      .eq('id', metodo.id)

    if (error) toast.error('Error al actualizar estado')
    else {
      toast.success(metodo.activo ? 'Método desactivado' : 'Método activado')
      setMetodos(prev =>
        prev.map(m => (m.id === metodo.id ? { ...m, activo: !m.activo } : m)),
      )
    }
  }

  const moveOrden = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= metodosVisibles.length) return

    const a = metodosVisibles[index]
    const b = metodosVisibles[target]
    const ordenA = a.orden
    const ordenB = b.orden

    const { error: errA } = await supabase
      .from('metodos_pago')
      .update({ orden: ordenB })
      .eq('id', a.id)
    const { error: errB } = await supabase
      .from('metodos_pago')
      .update({ orden: ordenA })
      .eq('id', b.id)

    if (errA || errB) {
      toast.error('Error al reordenar')
      return
    }

    setMetodos(prev => {
      const next = [...prev]
      const idxA = next.findIndex(m => m.id === a.id)
      const idxB = next.findIndex(m => m.id === b.id)
      if (idxA < 0 || idxB < 0) return prev
      next[idxA] = { ...a, orden: ordenB }
      next[idxB] = { ...b, orden: ordenA }
      return next.sort((x, y) => x.orden - y.orden)
    })
  }

  if (loadError && !loading && metodos.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
        <AdminLoadError
          title="No se pudieron cargar los métodos de pago"
          onRetry={() => void fetchMetodos()}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-[rgba(169,137,224,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">Checkout</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Métodos de pago
          </h1>
          <p className="mt-2 max-w-xl text-[14px] font-medium text-[var(--text-secondary)]">
            Medios del carrito, recargo por catálogo y visibilidad en detal o
            mayorista. La cuenta para consignar está en Configuración →
            Consignación.
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="self-start sm:self-auto">
          <Plus size={13} />
          Nuevo método
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: 'todos' as const, label: 'Todos' },
            { id: 'detal' as const, label: 'Detal' },
            { id: 'mayoreo' as const, label: 'Mayorista' },
          ]
        ).map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFiltroCatalogo(opt.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
              filtroCatalogo === opt.id
                ? 'border-[var(--accent-primary)] bg-[rgba(169,137,224,0.14)] text-[var(--accent-deep)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <AdminTable minWidth="960px">
          <AdminTableHead>
            <AdminTableHeaderRow>
              {Array.from({ length: 7 }).map((_, i) => (
                <AdminTableTh key={i} />
              ))}
            </AdminTableHeaderRow>
          </AdminTableHead>
          <AdminTableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <AdminTableSkeletonRow key={i} cols={7} />
            ))}
          </AdminTableBody>
        </AdminTable>
      ) : metodosVisibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.08)] text-[var(--accent-primary)]">
            <CreditCard size={22} />
          </span>
          <p className="text-[14px] font-light text-[var(--text-primary)]">
            {metodos.length === 0
              ? 'Aún no hay métodos de pago'
              : 'No hay métodos en este catálogo'}
          </p>
          <p className="mt-1 max-w-sm text-[12px] text-[var(--text-muted)]">
            Crea ePayco, Addi, transferencia u otros con su recargo y catálogo.
          </p>
          <Button onClick={abrirCrear} size="sm" className="mt-6">
            <Plus size={13} />
            Crear método
          </Button>
        </div>
      ) : (
        <AdminTable minWidth="960px">
          <AdminTableHead>
            <AdminTableHeaderRow>
              <AdminTableTh className="w-16">#</AdminTableTh>
              <AdminTableTh className="min-w-[11rem]">Método</AdminTableTh>
              <AdminTableTh className="min-w-[8.5rem]">Catálogos</AdminTableTh>
              <AdminTableTh>Recargo detal</AdminTableTh>
              <AdminTableTh>Recargo mayoreo</AdminTableTh>
              <AdminTableTh>Estado</AdminTableTh>
              <AdminTableTh className="w-28">Acciones</AdminTableTh>
            </AdminTableHeaderRow>
          </AdminTableHead>
          <AdminTableBody>
            <AnimatePresence initial={false}>
              {metodosVisibles.map((m, index) => {
                const detal = m.mostrar_detal ?? true
                const mayoreo = m.mostrar_mayoreo ?? true
                const recargoDetal = Number(m.recargo_detal_porcentaje) || 0
                const recargoMayoreo = Number(m.recargo_mayoreo_porcentaje) || 0

                return (
                  <motion.tr
                    key={m.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group border-b border-[var(--border-subtle)] transition-colors hover:bg-[rgba(169,137,224,0.04)]"
                  >
                    <AdminTableTd>
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => void moveOrden(index, -1)}
                          disabled={index === 0}
                          className="rounded p-0.5 text-[var(--text-faint)] transition-colors hover:text-[var(--accent-primary)] disabled:opacity-30"
                          aria-label="Subir orden"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
                          {m.orden}
                        </span>
                        <button
                          type="button"
                          onClick={() => void moveOrden(index, 1)}
                          disabled={index === metodosVisibles.length - 1}
                          className="rounded p-0.5 text-[var(--text-faint)] transition-colors hover:text-[var(--accent-primary)] disabled:opacity-30"
                          aria-label="Bajar orden"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 scale-125 rounded-xl bg-[rgba(169,137,224,0.12)] blur-md opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(169,137,224,0.28)] bg-gradient-to-br from-[rgba(169,137,224,0.16)] to-[rgba(232,160,200,0.08)] text-[12px] font-bold text-[var(--accent-deep)] shadow-[0_4px_14px_rgba(169,137,224,0.12)]">
                            {metodoIconLabel(m.nombre)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate text-[14px] font-semibold text-[var(--text-primary)]"
                            title={m.nombre}
                          >
                            {m.nombre}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {recargoDetal > 0 || recargoMayoreo > 0
                              ? `Recargo hasta ${formatPorcentajeRecargo(Math.max(recargoDetal, recargoMayoreo))}%`
                              : 'Sin recargo'}
                          </p>
                        </div>
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
                      <CatalogPills detal={detal} mayoreo={mayoreo} />
                    </AdminTableTd>
                    <AdminTableTd>
                      <RecargoPill value={recargoDetal} />
                    </AdminTableTd>
                    <AdminTableTd>
                      <RecargoPill value={recargoMayoreo} />
                    </AdminTableTd>
                    <AdminTableTd>
                      <button
                        type="button"
                        onClick={() => void toggleActivo(m)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                          m.activo
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-faint)]'
                        }`}
                      >
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </AdminTableTd>
                    <AdminTableTd>
                      <AdminTableActions
                        onEdit={() => abrirEditar(m)}
                        onDelete={() => {
                          setSelected(m)
                          setDeleteModal(true)
                        }}
                      />
                    </AdminTableTd>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </AdminTableBody>
        </AdminTable>
      )}

      <div className="mt-6 flex gap-3 rounded-xl border border-[rgba(169,137,224,0.2)] bg-[rgba(169,137,224,0.06)] px-4 py-3.5">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
        <p className="text-[12px] font-light leading-relaxed text-[var(--text-muted)]">
          Un método puede mostrarse solo en detal, solo en mayorista o en ambos.
          El recargo se calcula sobre el subtotal de productos. Para transferencia,
          activa el método aquí y configura la cuenta en Configuración → Consignación.
        </p>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar método de pago' : 'Nuevo método de pago'}
        size="lg"
      >
        <form onSubmit={handleGuardar} className="space-y-6">
          <FormSection
            title="Identificación"
            description="Nombre que verá el cliente al elegir cómo pagar."
          >
            <Input
              label="Nombre del método *"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Addi, ePayco, Transferencia…"
            />
          </FormSection>

          <FormSection
            title="Catálogos"
            description="Define en qué tienda aparece esta opción."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setForm(f => ({ ...f, mostrar_detal: !f.mostrar_detal }))
                }
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  form.mostrar_detal
                    ? 'border-[rgba(169,137,224,0.45)] bg-[rgba(169,137,224,0.1)] shadow-[0_4px_16px_rgba(169,137,224,0.08)]'
                    : 'border-[var(--border)] bg-[var(--bg-muted)] opacity-75 hover:opacity-100'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    form.mostrar_detal
                      ? 'border-[rgba(169,137,224,0.35)] bg-white text-[var(--accent-deep)]'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <Sparkles size={16} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-[var(--text-primary)]">
                    Catálogo detal
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Tienda principal /
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm(f => ({ ...f, mostrar_mayoreo: !f.mostrar_mayoreo }))
                }
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  form.mostrar_mayoreo
                    ? 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.08)] shadow-[0_4px_16px_rgba(96,165,250,0.08)]'
                    : 'border-[var(--border)] bg-[var(--bg-muted)] opacity-75 hover:opacity-100'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    form.mostrar_mayoreo
                      ? 'border-[rgba(96,165,250,0.35)] bg-white text-blue-500'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <Store size={16} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-[var(--text-primary)]">
                    Catálogo mayorista
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    /mayorista
                  </span>
                </span>
              </button>
            </div>
          </FormSection>

          <FormSection
            title="Recargos"
            description="Porcentaje adicional sobre el subtotal. Usa 0 si no aplica."
          >
            <div className="admin-form-panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent-deep)]">
                  <Percent size={13} />
                  Detal
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.recargo_detal_porcentaje}
                  onChange={e =>
                    setForm(f => ({ ...f, recargo_detal_porcentaje: e.target.value }))
                  }
                  placeholder="0"
                  className="admin-input w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold tabular-nums"
                />
                <p className="text-[11px] text-[var(--text-subtle)]">0 = sin recargo</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-500">
                  <Percent size={13} />
                  Mayorista
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.recargo_mayoreo_porcentaje}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      recargo_mayoreo_porcentaje: e.target.value,
                    }))
                  }
                  placeholder="0"
                  className="admin-input w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold tabular-nums"
                />
                <p className="text-[11px] text-[var(--text-subtle)]">0 = sin recargo</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Orden y disponibilidad">
            <div className="space-y-3">
              <Input
                label="Orden en el checkout"
                type="number"
                value={form.orden}
                onChange={e =>
                  setForm(f => ({ ...f, orden: Number(e.target.value) }))
                }
                hint="Menor número = aparece primero"
              />
              <div className="admin-form-panel flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="admin-form-panel__title">Activo en el checkout</p>
                  <p className="admin-form-panel__desc">
                    Si está inactivo, no aparece aunque el catálogo esté marcado
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`admin-toggle ${form.activo ? 'admin-toggle--on' : 'admin-toggle--off'}`}
                  aria-pressed={form.activo}
                >
                  <span className="admin-toggle__thumb" />
                </button>
              </div>
            </div>
          </FormSection>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="sm:min-w-[8rem]"
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="sm:min-w-[10rem]">
              {selected ? 'Guardar cambios' : 'Crear método'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Eliminar método"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-[13px] font-light leading-relaxed text-[var(--text-secondary)]">
            ¿Eliminar{' '}
            <span className="font-semibold text-[var(--accent-secondary)]">
              {selected?.nombre}
            </span>
            ? Dejará de aparecer en el checkout.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleEliminar()}
              loading={deleting}
              fullWidth
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
