'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MetodoPago } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderRow,
  AdminTableTh,
  AdminTableBody,
  AdminTableRow,
  AdminTableTd,
  AdminTableEmpty,
  AdminTableSkeletonRow,
  AdminTableActions,
  AdminTablePrimary,
} from '@/components/admin/AdminTable'
import AdminLoadError from '@/components/admin/AdminLoadError'
import toast from 'react-hot-toast'
import { CreditCard, Plus } from 'lucide-react'
import { formatPorcentajeRecargo } from '@/lib/payment-methods'

type FormState = {
  nombre: string
  recargo_detal_porcentaje: string
  recargo_mayoreo_porcentaje: string
  orden: number
  activo: boolean
}

const emptyForm = (orden = 1): FormState => ({
  nombre: '',
  recargo_detal_porcentaje: '0',
  recargo_mayoreo_porcentaje: '0',
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.35rem] font-semibold text-[var(--text-primary)] md:text-[1.5rem]">
            Métodos de pago
          </h1>
          <p className="mt-1 text-[13px] font-light text-[var(--text-secondary)]">
            Configura los medios del checkout y el recargo % por catálogo (detal /
            mayorista). Usa 0 si no hay recargo.
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm">
          <Plus size={14} />
          Nuevo método
        </Button>
      </div>

      <AdminTable>
        <AdminTableHead>
          <AdminTableHeaderRow>
            <AdminTableTh className="w-[28%]">Método</AdminTableTh>
            <AdminTableTh className="w-[14%]">Recargo detal</AdminTableTh>
            <AdminTableTh className="w-[14%]">Recargo mayoreo</AdminTableTh>
            <AdminTableTh className="w-[10%]">Orden</AdminTableTh>
            <AdminTableTh className="w-[12%]">Estado</AdminTableTh>
            <AdminTableTh className="w-[12%] text-center">Acciones</AdminTableTh>
          </AdminTableHeaderRow>
        </AdminTableHead>
        <AdminTableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <AdminTableSkeletonRow key={i} cols={6} />
            ))
          ) : metodos.length === 0 ? (
            <AdminTableEmpty
              colSpan={6}
              icon={CreditCard}
              title="Aún no hay métodos de pago"
              description="Crea ePayco, Addi, efectivo u otros con su recargo por catálogo"
              action={
                <Button onClick={abrirCrear} size="sm">
                  <Plus size={13} />
                  Crear método
                </Button>
              }
            />
          ) : (
            metodos.map((m, i) => (
              <AdminTableRow key={m.id} index={i}>
                <AdminTableTd>
                  <AdminTablePrimary title={m.nombre} />
                </AdminTableTd>
                <AdminTableTd>
                  <span className="text-[13px] font-light text-[var(--text-secondary)]">
                    {formatPorcentajeRecargo(m.recargo_detal_porcentaje)}%
                  </span>
                </AdminTableTd>
                <AdminTableTd>
                  <span className="text-[13px] font-light text-[var(--text-secondary)]">
                    {formatPorcentajeRecargo(m.recargo_mayoreo_porcentaje)}%
                  </span>
                </AdminTableTd>
                <AdminTableTd>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    #{m.orden}
                  </span>
                </AdminTableTd>
                <AdminTableTd>
                  <button
                    type="button"
                    onClick={() => void toggleActivo(m)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      m.activo
                        ? 'bg-[rgba(52,211,153,0.12)] text-emerald-400'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
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
              </AdminTableRow>
            ))
          )}
        </AdminTableBody>
      </AdminTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar método de pago' : 'Nuevo método de pago'}
        size="md"
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Addi, ePayco, Efectivo…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Recargo detal (%)"
              type="text"
              inputMode="decimal"
              value={form.recargo_detal_porcentaje}
              onChange={e =>
                setForm(f => ({ ...f, recargo_detal_porcentaje: e.target.value }))
              }
              placeholder="0"
              hint="0 = sin recargo en detal"
            />
            <Input
              label="Recargo mayorista (%)"
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
              hint="0 = sin recargo en mayorista"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Orden"
              type="number"
              value={form.orden}
              onChange={e =>
                setForm(f => ({ ...f, orden: Number(e.target.value) }))
              }
              hint="Menor número = aparece primero"
            />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 sm:mt-6">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e =>
                  setForm(f => ({ ...f, activo: e.target.checked }))
                }
                className="h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">
                Activo en el checkout
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth loading={saving}>
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
            <span className="text-[var(--accent-secondary)]">
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
