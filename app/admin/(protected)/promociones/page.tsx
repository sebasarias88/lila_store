'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Promocion } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderRow,
  AdminTableTh,
  AdminTableBody,
  AdminTableTd,
  AdminTableActions,
} from '@/components/admin/AdminTable'
import AdminLoadError from '@/components/admin/AdminLoadError'
import toast from 'react-hot-toast'
import {
  Plus,
  Tag,
  ChevronUp,
  ChevronDown,
  Upload,
  Info,
  ImageIcon,
} from 'lucide-react'

type PromoForm = {
  titulo: string
  descripcion: string
  imagen_url: string
  badge_texto: string
  badge_color: string
  fecha_inicio: string
  fecha_fin: string
  enlace: string
  orden: number
  activa: boolean
}

const emptyForm = (orden = 1): PromoForm => ({
  titulo: '',
  descripcion: '',
  imagen_url: '',
  badge_texto: '',
  badge_color: '#D4AF37',
  fecha_inicio: '',
  fecha_fin: '',
  enlace: '',
  orden,
  activa: true,
})

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function formatVigencia(promo: Promocion): {
  label: string
  expired: boolean
} {
  if (!promo.fecha_fin) return { label: 'Sin fecha límite', expired: false }
  const fin = new Date(promo.fecha_fin)
  const expired = fin < new Date()
  if (expired) return { label: 'Expirada', expired: true }
  return {
    label: `Activa hasta ${fin.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })}`,
    expired: false,
  }
}

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<Promocion | null>(null)
  const [form, setForm] = useState<PromoForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchPromociones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('promociones')
      .select('*')
      .order('orden', { ascending: true })

    if (error) {
      toast.error('Error al cargar promociones')
      setLoadError(true)
    } else {
      setPromociones((data as Promocion[]) || [])
      setLoadError(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPromociones()
  }, [fetchPromociones])

  const abrirCrear = () => {
    setSelected(null)
    const nextOrden =
      promociones.length > 0
        ? Math.max(...promociones.map(p => p.orden)) + 1
        : 1
    setForm(emptyForm(nextOrden))
    setModalOpen(true)
  }

  const abrirEditar = (promo: Promocion) => {
    setSelected(promo)
    setForm({
      titulo: promo.titulo,
      descripcion: promo.descripcion || '',
      imagen_url: promo.imagen_url || '',
      badge_texto: promo.badge_texto || '',
      badge_color: promo.badge_color || '#D4AF37',
      fecha_inicio: toLocalInput(promo.fecha_inicio),
      fecha_fin: toLocalInput(promo.fecha_fin),
      enlace: promo.enlace || '',
      orden: promo.orden,
      activa: promo.activa,
    })
    setModalOpen(true)
  }

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `banners/promos/${Date.now()}.${ext}`
    setUploading(true)
    const { error } = await supabase.storage.from('banners').upload(path, file, {
      upsert: true,
    })
    if (error) {
      toast.error('Error al subir la imagen')
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(path)
    setForm(f => ({ ...f, imagen_url: data.publicUrl }))
    toast.success('Imagen subida')
    setUploading(false)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    setSaving(true)
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
      badge_texto: form.badge_texto.trim() || null,
      badge_color: form.badge_color || '#D4AF37',
      fecha_inicio: fromLocalInput(form.fecha_inicio),
      fecha_fin: fromLocalInput(form.fecha_fin),
      enlace: form.enlace.trim() || null,
      orden: Number(form.orden) || 1,
      activa: form.activa,
    }

    const { error } = selected
      ? await supabase.from('promociones').update(payload).eq('id', selected.id)
      : await supabase.from('promociones').insert(payload)

    if (error) toast.error('Error al guardar la promoción')
    else {
      toast.success(selected ? 'Promoción actualizada' : 'Promoción creada')
      setModalOpen(false)
      fetchPromociones()
    }
    setSaving(false)
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase
      .from('promociones')
      .delete()
      .eq('id', selected.id)
    if (error) toast.error('Error al eliminar')
    else {
      toast.success('Promoción eliminada')
      setDeleteModal(false)
      setSelected(null)
      fetchPromociones()
    }
    setDeleting(false)
  }

  const toggleActiva = async (promo: Promocion) => {
    const { error } = await supabase
      .from('promociones')
      .update({ activa: !promo.activa })
      .eq('id', promo.id)

    if (error) toast.error('Error al actualizar estado')
    else {
      toast.success(promo.activa ? 'Promoción desactivada' : 'Promoción activada')
      setPromociones(prev =>
        prev.map(p => (p.id === promo.id ? { ...p, activa: !p.activa } : p)),
      )
    }
  }

  const moveOrden = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= promociones.length) return

    const a = promociones[index]
    const b = promociones[target]
    const ordenA = a.orden
    const ordenB = b.orden

    const { error: errA } = await supabase
      .from('promociones')
      .update({ orden: ordenB })
      .eq('id', a.id)
    const { error: errB } = await supabase
      .from('promociones')
      .update({ orden: ordenA })
      .eq('id', b.id)

    if (errA || errB) {
      toast.error('Error al reordenar')
      return
    }

    setPromociones(prev => {
      const next = [...prev]
      next[index] = { ...a, orden: ordenB }
      next[target] = { ...b, orden: ordenA }
      return next.sort((x, y) => x.orden - y.orden)
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-[rgba(232,136,181,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Catálogo
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Promociones
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            Franja promocional debajo del hero
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="self-start sm:self-auto">
          <Plus size={13} />
          Nueva promoción
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : loadError ? (
        <AdminLoadError
          onRetry={fetchPromociones}
          title="No se pudieron cargar las promociones"
        />
      ) : promociones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(232,136,181,0.25)] bg-[rgba(232,136,181,0.08)] text-[var(--accent-primary)]">
            <Tag size={22} />
          </span>
          <p className="text-[14px] font-light text-[var(--text-primary)]">
            Aún no hay promociones
          </p>
          <Button onClick={abrirCrear} size="sm" className="mt-6">
            <Plus size={13} />
            Crear promoción
          </Button>
        </div>
      ) : (
        <AdminTable minWidth="920px">
          <AdminTableHead>
            <AdminTableHeaderRow>
              <AdminTableTh className="w-16">#</AdminTableTh>
              <AdminTableTh>Badge</AdminTableTh>
              <AdminTableTh>Título</AdminTableTh>
              <AdminTableTh>Descripción</AdminTableTh>
              <AdminTableTh>Vigencia</AdminTableTh>
              <AdminTableTh>Estado</AdminTableTh>
              <AdminTableTh className="w-28">Acciones</AdminTableTh>
            </AdminTableHeaderRow>
          </AdminTableHead>
          <AdminTableBody>
            <AnimatePresence initial={false}>
              {promociones.map((promo, index) => {
                const vigencia = formatVigencia(promo)
                return (
                  <motion.tr
                    key={promo.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-[var(--border-subtle)]"
                  >
                    <AdminTableTd>
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveOrden(index, -1)}
                          disabled={index === 0}
                          className="rounded p-0.5 text-[var(--text-faint)] hover:text-[var(--accent-primary)] disabled:opacity-30"
                          aria-label="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                          {promo.orden}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveOrden(index, 1)}
                          disabled={index === promociones.length - 1}
                          className="rounded p-0.5 text-[var(--text-faint)] hover:text-[var(--accent-primary)] disabled:opacity-30"
                          aria-label="Bajar"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </AdminTableTd>
                    <AdminTableTd>
                      {promo.badge_texto ? (
                        <span
                          className="rounded-xl px-2 py-1 text-[9px] font-medium tracking-normal"
                          style={{
                            backgroundColor: `${promo.badge_color}18`,
                            color: promo.badge_color,
                            border: `0.5px solid ${promo.badge_color}40`,
                          }}
                        >
                          {promo.badge_texto}
                        </span>
                      ) : (
                        <span className="text-[var(--text-faint)]">—</span>
                      )}
                    </AdminTableTd>
                    <AdminTableTd>
                      <span className="text-[13px] text-[var(--text-primary)]">
                        {promo.titulo}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd>
                      <span className="line-clamp-2 max-w-[220px] text-[12px] text-[var(--text-muted)]">
                        {promo.descripcion || '—'}
                      </span>
                    </AdminTableTd>
                    <AdminTableTd>
                      {vigencia.expired ? (
                        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[1px] text-red-400">
                          Expirada
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-subtle)]">
                          {vigencia.label}
                        </span>
                      )}
                    </AdminTableTd>
                    <AdminTableTd>
                      <button
                        type="button"
                        onClick={() => toggleActiva(promo)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[1px] transition-colors ${
                          promo.activa
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-[var(--border-subtle)] text-[var(--text-faint)]'
                        }`}
                      >
                        {promo.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </AdminTableTd>
                    <AdminTableTd>
                      <AdminTableActions
                        onEdit={() => abrirEditar(promo)}
                        onDelete={() => {
                          setSelected(promo)
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

      <div className="mt-6 flex gap-3 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.04)] px-4 py-3.5">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
        <p className="text-[12px] font-light leading-relaxed text-[var(--text-muted)]">
          Las promociones aparecen en la franja debajo del banner principal en el
          catálogo. Solo se muestran las activas y dentro de su rango de fechas.
        </p>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar promoción' : 'Nueva promoción'}
        size="lg"
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          <Input
            label="Título *"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Envío gratis en Armenia"
            required
          />
          <Textarea
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="En pedidos mayores a $80.000"
          />

          <div className="space-y-2">
            <label className="admin-form-label">Imagen (opcional)</label>
            {form.imagen_url ? (
              <img
                src={form.imagen_url}
                alt="Preview"
                className="h-28 w-full rounded-xl border border-[rgba(212,175,55,0.15)] object-cover"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--border-card)] bg-[var(--bg-surface)]">
                <ImageIcon size={22} className="text-[var(--text-faint)]" />
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-input)] px-3 py-2 text-[11px] uppercase tracking-[1px] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
              <Upload size={12} />
              {uploading ? 'Subiendo…' : 'Subir imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(file)
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Texto del badge"
              value={form.badge_texto}
              onChange={e => setForm(f => ({ ...f, badge_texto: e.target.value }))}
              placeholder="HOT / NUEVO / -20%"
            />
            <div className="space-y-1.5">
              <label className="admin-form-label">Color del badge</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.badge_color}
                  onChange={e =>
                    setForm(f => ({ ...f, badge_color: e.target.value }))
                  }
                  className="h-11 w-14 cursor-pointer rounded-xl border border-[var(--border-input)] bg-transparent p-1"
                />
                <span className="text-[12px] text-[var(--text-muted)]">
                  {form.badge_color}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fecha inicio"
              type="datetime-local"
              value={form.fecha_inicio}
              onChange={e =>
                setForm(f => ({ ...f, fecha_inicio: e.target.value }))
              }
            />
            <Input
              label="Fecha fin"
              type="datetime-local"
              value={form.fecha_fin}
              onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
            />
          </div>

          <Input
            label="Enlace"
            value={form.enlace}
            onChange={e => setForm(f => ({ ...f, enlace: e.target.value }))}
            placeholder="/productos?categoria=capilar"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Orden"
              type="number"
              min={1}
              value={form.orden}
              onChange={e =>
                setForm(f => ({ ...f, orden: Number(e.target.value) || 1 }))
              }
            />
            <div className="flex items-end pb-1">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-[12px] transition-colors ${
                  form.activa
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--border-input)] text-[var(--text-muted)]'
                }`}
              >
                <span className="uppercase tracking-[1px]">
                  {form.activa ? 'Activa' : 'Inactiva'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selected ? 'Guardar cambios' : 'Crear promoción'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Eliminar promoción"
        size="sm"
      >
        <p className="mb-6 text-[14px] font-medium text-[var(--text-secondary)]">
          ¿Eliminar esta promoción? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleEliminar}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
