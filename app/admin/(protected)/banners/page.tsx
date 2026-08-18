'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Banner } from '@/types'
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
  AdminTableActions,
} from '@/components/admin/AdminTable'
import AdminLoadError from '@/components/admin/AdminLoadError'
import toast from 'react-hot-toast'
import {
  Plus,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  Upload,
} from 'lucide-react'

type BannerForm = {
  titulo: string
  subtitulo: string
  texto_boton: string
  enlace_boton: string
  orden: number
  activo: boolean
  imagen_url: string
}

const emptyForm = (orden = 1): BannerForm => ({
  titulo: '',
  subtitulo: '',
  texto_boton: '',
  enlace_boton: '',
  orden,
  activo: true,
  imagen_url: '',
})

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<Banner | null>(null)
  const [form, setForm] = useState<BannerForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('orden', { ascending: true })

    if (error) {
      toast.error('Error al cargar banners')
      setLoadError(true)
    } else {
      setBanners((data as Banner[]) || [])
      setLoadError(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const abrirCrear = () => {
    setSelected(null)
    const nextOrden =
      banners.length > 0 ? Math.max(...banners.map(b => b.orden)) + 1 : 1
    setForm(emptyForm(nextOrden))
    setModalOpen(true)
  }

  const abrirEditar = (banner: Banner) => {
    setSelected(banner)
    setForm({
      titulo: banner.titulo || '',
      subtitulo: banner.subtitulo || '',
      texto_boton: banner.texto_boton || '',
      enlace_boton: banner.enlace_boton || '',
      orden: banner.orden,
      activo: banner.activo,
      imagen_url: banner.imagen_url,
    })
    setModalOpen(true)
  }

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `banners/${Date.now()}.${ext}`
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
    if (!form.imagen_url.trim()) {
      toast.error('La imagen es obligatoria')
      return
    }

    setSaving(true)
    const payload = {
      titulo: form.titulo.trim() || null,
      subtitulo: form.subtitulo.trim() || null,
      texto_boton: form.texto_boton.trim() || null,
      enlace_boton: form.enlace_boton.trim() || null,
      orden: Number(form.orden) || 1,
      activo: form.activo,
      imagen_url: form.imagen_url,
    }

    const { error } = selected
      ? await supabase.from('banners').update(payload).eq('id', selected.id)
      : await supabase.from('banners').insert(payload)

    if (error) toast.error('Error al guardar el banner')
    else {
      toast.success(selected ? 'Banner actualizado' : 'Banner creado')
      setModalOpen(false)
      fetchBanners()
    }
    setSaving(false)
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase.from('banners').delete().eq('id', selected.id)
    if (error) toast.error('Error al eliminar')
    else {
      toast.success('Banner eliminado')
      setDeleteModal(false)
      setSelected(null)
      fetchBanners()
    }
    setDeleting(false)
  }

  const toggleActivo = async (banner: Banner) => {
    const { error } = await supabase
      .from('banners')
      .update({ activo: !banner.activo })
      .eq('id', banner.id)

    if (error) toast.error('Error al actualizar estado')
    else {
      toast.success(banner.activo ? 'Banner desactivado' : 'Banner activado')
      setBanners(prev =>
        prev.map(b => (b.id === banner.id ? { ...b, activo: !b.activo } : b)),
      )
    }
  }

  const moveOrden = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= banners.length) return

    const a = banners[index]
    const b = banners[target]
    const ordenA = a.orden
    const ordenB = b.orden

    const { error: errA } = await supabase
      .from('banners')
      .update({ orden: ordenB })
      .eq('id', a.id)
    const { error: errB } = await supabase
      .from('banners')
      .update({ orden: ordenA })
      .eq('id', b.id)

    if (errA || errB) {
      toast.error('Error al reordenar')
      return
    }

    setBanners(prev => {
      const next = [...prev]
      next[index] = { ...a, orden: ordenB }
      next[target] = { ...b, orden: ordenA }
      return next.sort((x, y) => x.orden - y.orden)
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-[rgba(169,137,224,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Catálogo
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Banners
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            Imágenes del hero principal. Se muestran completas a lo ancho, sin recortar.
            Recomendado: banner horizontal (p. ej. 1920×700).
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="self-start sm:self-auto">
          <Plus size={13} />
          Nuevo banner
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
        <AdminLoadError onRetry={fetchBanners} title="No se pudieron cargar los banners" />
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.08)] text-[var(--accent-primary)]">
            <ImageIcon size={22} />
          </span>
          <p className="text-[14px] font-light text-[var(--text-primary)]">
            No hay banners. El hero mostrará el diseño predeterminado.
          </p>
          <Button onClick={abrirCrear} size="sm" className="mt-6">
            <Plus size={13} />
            Crear banner
          </Button>
        </div>
      ) : (
        <AdminTable minWidth="880px">
          <AdminTableHead>
            <AdminTableHeaderRow>
              <AdminTableTh className="w-16">#</AdminTableTh>
              <AdminTableTh>Preview</AdminTableTh>
              <AdminTableTh>Título</AdminTableTh>
              <AdminTableTh>Subtítulo</AdminTableTh>
              <AdminTableTh>Botón</AdminTableTh>
              <AdminTableTh>Estado</AdminTableTh>
              <AdminTableTh className="w-28">Acciones</AdminTableTh>
            </AdminTableHeaderRow>
          </AdminTableHead>
          <AdminTableBody>
            <AnimatePresence initial={false}>
              {banners.map((banner, index) => (
                <motion.tr
                  key={banner.id}
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
                        {banner.orden}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveOrden(index, 1)}
                        disabled={index === banners.length - 1}
                        className="rounded p-0.5 text-[var(--text-faint)] hover:text-[var(--accent-primary)] disabled:opacity-30"
                        aria-label="Bajar"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </AdminTableTd>
                  <AdminTableTd>
                    <img
                      src={banner.imagen_url}
                      alt={banner.titulo || 'Banner'}
                      className="h-12 w-20 rounded-xl border border-[rgba(212,175,55,0.15)] object-cover"
                    />
                  </AdminTableTd>
                  <AdminTableTd>
                    <span className="text-[13px] text-[var(--text-primary)]">
                      {banner.titulo || '—'}
                    </span>
                  </AdminTableTd>
                  <AdminTableTd>
                    <span className="line-clamp-2 max-w-[200px] text-[12px] text-[var(--text-muted)]">
                      {banner.subtitulo || '—'}
                    </span>
                  </AdminTableTd>
                  <AdminTableTd>
                    <span className="text-[11px] text-[var(--text-subtle)]">
                      {banner.texto_boton || '—'}
                    </span>
                  </AdminTableTd>
                  <AdminTableTd>
                    <button
                      type="button"
                      onClick={() => toggleActivo(banner)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[1px] transition-colors ${
                        banner.activo
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-[var(--border-subtle)] text-[var(--text-faint)]'
                      }`}
                    >
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </AdminTableTd>
                  <AdminTableTd>
                    <AdminTableActions
                      onEdit={() => abrirEditar(banner)}
                      onDelete={() => {
                        setSelected(banner)
                        setDeleteModal(true)
                      }}
                    />
                  </AdminTableTd>
                </motion.tr>
              ))}
            </AnimatePresence>
          </AdminTableBody>
        </AdminTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar banner' : 'Nuevo banner'}
        size="lg"
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="space-y-2">
            <label className="admin-form-label">Imagen *</label>
            {form.imagen_url ? (
              <div className="relative overflow-hidden rounded-xl border border-[rgba(212,175,55,0.15)] bg-[var(--bg-surface)]">
                <img
                  src={form.imagen_url}
                  alt="Preview"
                  className="mx-auto max-h-56 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--border-card)] bg-[var(--bg-surface)]">
                <ImageIcon size={28} className="text-[var(--text-faint)]" />
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

          <Input
            label="Título"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Belleza y cuidado capilar"
          />
          <Input
            label="Subtítulo"
            value={form.subtitulo}
            onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))}
            placeholder="Productos profesionales para cada tipo de cabello"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Texto del botón"
              value={form.texto_boton}
              onChange={e => setForm(f => ({ ...f, texto_boton: e.target.value }))}
              placeholder="Ver colección"
            />
            <Input
              label="Enlace del botón"
              value={form.enlace_boton}
              onChange={e => setForm(f => ({ ...f, enlace_boton: e.target.value }))}
              placeholder="/productos"
            />
          </div>
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
                onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-[12px] transition-colors ${
                  form.activo
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--border-input)] text-[var(--text-muted)]'
                }`}
              >
                <span className="uppercase tracking-[1px]">
                  {form.activo ? 'Activo' : 'Inactivo'}
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
              {selected ? 'Guardar cambios' : 'Crear banner'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Eliminar banner"
        size="sm"
      >
        <p className="mb-6 text-[14px] font-medium text-[var(--text-secondary)]">
          ¿Eliminar este banner? Esta acción no se puede deshacer.
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
