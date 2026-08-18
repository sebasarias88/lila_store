'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { AnuncioModal } from '@/types'
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
import {
  addDaysIso,
  endOfDayIso,
  getAnuncioVigencia,
  type AnuncioVigencia,
} from '@/lib/anuncio-modal'
import toast from 'react-hot-toast'
import { Plus, Sparkles, Upload, Search, X } from 'lucide-react'

type DuracionPreset = '3' | '7' | '15' | '30' | 'custom'

type AnuncioForm = {
  titulo: string
  descripcion: string
  texto_boton: string
  imagen_url: string
  producto_id: string
  producto_nombre: string
  enlace_manual: string
  activo: boolean
  mostrar_una_vez_por_sesion: boolean
  duracion: DuracionPreset
  fecha_fin_custom: string
}

type ProductoOption = {
  id: string
  nombre: string
  slug: string
}

const emptyForm = (): AnuncioForm => ({
  titulo: '',
  descripcion: '',
  texto_boton: 'Ver producto',
  imagen_url: '',
  producto_id: '',
  producto_nombre: '',
  enlace_manual: '',
  activo: true,
  mostrar_una_vez_por_sesion: true,
  duracion: '7',
  fecha_fin_custom: '',
})

function vigenciaBadge(v: AnuncioVigencia): {
  label: string
  className: string
} {
  switch (v) {
    case 'activo':
      return {
        label: 'Vigente',
        className:
          'bg-[color-mix(in_srgb,#22c55e_14%,white)] text-[color-mix(in_srgb,#15803d_85%,black)]',
      }
    case 'programado':
      return {
        label: 'Programado',
        className: 'bg-[var(--bg-muted)] text-[var(--accent-deep)]',
      }
    case 'expirado':
      return {
        label: 'Expirado',
        className: 'bg-[color-mix(in_srgb,#ef4444_12%,white)] text-[#b91c1c]',
      }
    default:
      return {
        label: 'Inactivo',
        className: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
      }
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function AnuncioPage() {
  const [anuncios, setAnuncios] = useState<AnuncioModal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<AnuncioModal | null>(null)
  const [form, setForm] = useState<AnuncioForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<ProductoOption[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  const fetchAnuncios = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('anuncio_modal')
      .select('*, producto:productos(id, nombre, slug)')
      .order('fecha_inicio', { ascending: false })

    if (error) {
      toast.error('Error al cargar anuncios')
      setLoadError(true)
    } else {
      setAnuncios((data as AnuncioModal[]) || [])
      setLoadError(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchAnuncios()
  }, [fetchAnuncios])

  useEffect(() => {
    if (!productQuery.trim() || form.enlace_manual.trim()) {
      setProductResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearchingProducts(true)
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, slug')
        .ilike('nombre', `%${productQuery.trim()}%`)
        .limit(8)
      setProductResults((data as ProductoOption[]) || [])
      setSearchingProducts(false)
    }, 280)
    return () => clearTimeout(t)
  }, [productQuery, form.enlace_manual])

  const abrirCrear = () => {
    setSelected(null)
    setForm(emptyForm())
    setProductQuery('')
    setProductResults([])
    setModalOpen(true)
  }

  const abrirEditar = (anuncio: AnuncioModal) => {
    setSelected(anuncio)
    const fin = anuncio.fecha_fin ? new Date(anuncio.fecha_fin) : null
    const finYmd =
      fin && !Number.isNaN(fin.getTime())
        ? `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`
        : ''
    setForm({
      titulo: anuncio.titulo || '',
      descripcion: anuncio.descripcion || '',
      texto_boton: anuncio.texto_boton || 'Ver producto',
      imagen_url: anuncio.imagen_url || '',
      producto_id: anuncio.producto_id || '',
      producto_nombre: anuncio.producto?.nombre || '',
      enlace_manual: anuncio.enlace_manual || '',
      activo: anuncio.activo,
      mostrar_una_vez_por_sesion: anuncio.mostrar_una_vez_por_sesion,
      duracion: 'custom',
      fecha_fin_custom: finYmd,
    })
    setProductQuery('')
    setProductResults([])
    setModalOpen(true)
  }

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `anuncio-modal/${Date.now()}.${ext}`
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

  const resolveFechas = (): { fecha_inicio: string; fecha_fin: string } | null => {
    if (form.duracion === 'custom') {
      const fin = endOfDayIso(form.fecha_fin_custom)
      if (!fin) {
        toast.error('Elige una fecha de fin válida')
        return null
      }
      const finDate = new Date(fin)
      if (finDate < new Date()) {
        toast.error('La fecha de fin debe ser futura')
        return null
      }
      return {
        fecha_inicio: new Date().toISOString(),
        fecha_fin: fin,
      }
    }
    const days = Number(form.duracion)
    return addDaysIso(days)
  }

  const handleGuardar = async () => {
    if (!form.imagen_url.trim()) {
      toast.error('Sube una imagen para el anuncio')
      return
    }
    if (!form.titulo.trim()) {
      toast.error('El título es requerido')
      return
    }
    if (form.producto_id && form.enlace_manual.trim()) {
      toast.error('Elige producto o link manual, no ambos')
      return
    }
    if (form.enlace_manual.trim()) {
      try {
        const u = new URL(form.enlace_manual.trim())
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          toast.error('El link manual debe ser una URL válida')
          return
        }
      } catch {
        toast.error('El link manual no es una URL válida')
        return
      }
    }

    const fechas = resolveFechas()
    if (!fechas) return

    setSaving(true)
    const payload = {
      activo: form.activo,
      imagen_url: form.imagen_url.trim(),
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      texto_boton: form.texto_boton.trim() || 'Ver más',
      producto_id: form.producto_id || null,
      enlace_manual: form.producto_id
        ? null
        : form.enlace_manual.trim() || null,
      fecha_inicio: fechas.fecha_inicio,
      fecha_fin: fechas.fecha_fin,
      mostrar_una_vez_por_sesion: form.mostrar_una_vez_por_sesion,
    }

    if (selected) {
      const { error } = await supabase
        .from('anuncio_modal')
        .update(payload)
        .eq('id', selected.id)
      if (error) {
        toast.error('Error al actualizar el anuncio')
        setSaving(false)
        return
      }
      toast.success('Anuncio actualizado')
    } else {
      const { error } = await supabase.from('anuncio_modal').insert([payload])
      if (error) {
        toast.error('Error al crear el anuncio')
        setSaving(false)
        return
      }
      toast.success('Anuncio creado')
    }

    setSaving(false)
    setModalOpen(false)
    void fetchAnuncios()
  }

  const handleToggleActivo = async (anuncio: AnuncioModal) => {
    const { error } = await supabase
      .from('anuncio_modal')
      .update({ activo: !anuncio.activo })
      .eq('id', anuncio.id)
    if (error) {
      toast.error('No se pudo actualizar')
      return
    }
    toast.success(anuncio.activo ? 'Anuncio desactivado' : 'Anuncio activado')
    void fetchAnuncios()
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)
    const { error } = await supabase
      .from('anuncio_modal')
      .delete()
      .eq('id', selected.id)
    if (error) {
      toast.error('Error al eliminar')
      setDeleting(false)
      return
    }
    toast.success('Anuncio eliminado')
    setDeleting(false)
    setDeleteModal(false)
    setSelected(null)
    void fetchAnuncios()
  }

  const destinoBloqueadoPorProducto = Boolean(form.producto_id)
  const destinoBloqueadoPorLink = Boolean(form.enlace_manual.trim())

  return (
    <div className="min-h-screen space-y-6 bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3 py-1.5">
            <Sparkles size={13} className="text-[var(--accent-primary)]" />
            <span className="text-[12px] font-bold text-[var(--accent-deep)]">
              Popup de producto nuevo
            </span>
          </div>
          <h1 className="text-[1.5rem] font-bold text-[var(--text-primary)]">
            Anuncio destacado
          </h1>
          <p className="mt-1 max-w-xl text-[13px] font-medium text-[var(--text-muted)]">
            Modal que aparece en el inicio mientras esté vigente. Se apaga solo
            al llegar a la fecha de fin.
          </p>
        </div>
        <Button onClick={abrirCrear} className="shrink-0 gap-2">
          <Plus size={16} />
          Nuevo anuncio
        </Button>
      </div>

      {loadError ? (
        <AdminLoadError onRetry={() => void fetchAnuncios()} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-[var(--bg-muted)]"
            />
          ))}
        </div>
      ) : anuncios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-14 text-center">
          <Sparkles
            size={28}
            className="mx-auto text-[var(--accent-primary)]"
          />
          <p className="mt-3 text-[14px] font-bold text-[var(--text-primary)]">
            Aún no hay anuncios
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Crea uno para destacar un producto nuevo en el inicio
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHead>
                <AdminTableHeaderRow>
                  <AdminTableTh>Anuncio</AdminTableTh>
                  <AdminTableTh>Estado</AdminTableTh>
                  <AdminTableTh>Vigencia</AdminTableTh>
                  <AdminTableTh>Destino</AdminTableTh>
                  <AdminTableTh className="text-right">Acciones</AdminTableTh>
                </AdminTableHeaderRow>
              </AdminTableHead>
              <AdminTableBody>
                {anuncios.map(a => {
                  const v = getAnuncioVigencia(a)
                  const badge = vigenciaBadge(v)
                  return (
                    <tr key={a.id} className="border-b border-[var(--border)]">
                      <AdminTableTd>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                            {a.imagen_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.imagen_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                              {a.titulo || 'Sin título'}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-muted)]">
                              {a.mostrar_una_vez_por_sesion
                                ? 'Una vez por sesión'
                                : 'Cada visita'}
                            </p>
                          </div>
                        </div>
                      </AdminTableTd>
                      <AdminTableTd>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </AdminTableTd>
                      <AdminTableTd>
                        <p className="text-[12px] font-medium text-[var(--text-secondary)]">
                          {formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}
                        </p>
                      </AdminTableTd>
                      <AdminTableTd>
                        <p className="max-w-[180px] truncate text-[12px] text-[var(--text-muted)]">
                          {a.producto?.nombre ||
                            a.enlace_manual ||
                            'Solo cerrar'}
                        </p>
                      </AdminTableTd>
                      <AdminTableTd>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleToggleActivo(a)}
                            className="rounded-lg px-2 py-1 text-[11px] font-bold text-[var(--accent-deep)] hover:bg-[var(--bg-muted)]"
                          >
                            {a.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <AdminTableActions
                            onEdit={() => abrirEditar(a)}
                            onDelete={() => {
                              setSelected(a)
                              setDeleteModal(true)
                            }}
                          />
                        </div>
                      </AdminTableTd>
                    </tr>
                  )
                })}
              </AdminTableBody>
            </AdminTable>
          </div>

          <div className="space-y-3 md:hidden">
            {anuncios.map(a => {
              const v = getAnuncioVigencia(a)
              const badge = vigenciaBadge(v)
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                      {a.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.imagen_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[var(--text-primary)]">
                        {a.titulo || 'Sin título'}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        Hasta {formatDate(a.fecha_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => abrirEditar(a)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => void handleToggleActivo(a)}
                    >
                      {a.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar anuncio' : 'Nuevo anuncio'}
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <p className="admin-form-label mb-2">Imagen *</p>
            {form.imagen_url ? (
              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imagen_url}
                  alt=""
                  className="max-h-56 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[var(--text-muted)] shadow"
                  aria-label="Quitar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)] px-4 py-10 text-center transition-colors hover:border-[var(--accent-primary)]">
                <Upload size={22} className="text-[var(--accent-primary)]" />
                <span className="text-[13px] font-bold text-[var(--accent-deep)]">
                  {uploading ? 'Subiendo…' : 'Subir imagen'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void uploadImage(file)
                  }}
                />
              </label>
            )}
          </div>

          <Input
            label="Título *"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="¡Nuevo producto en tienda! ✨"
          />
          <Textarea
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Cuéntale a tus clientas qué es lo nuevo…"
          />
          <Input
            label="Texto del botón"
            value={form.texto_boton}
            onChange={e => setForm(f => ({ ...f, texto_boton: e.target.value }))}
            placeholder="Ver producto"
          />

          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)]/50 p-4">
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Destino del botón (elige uno)
            </p>
            <div className="relative">
              <label className="admin-form-label mb-1.5 block">
                Producto (opcional)
              </label>
              {form.producto_id ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5">
                  <span className="truncate text-[13px] font-medium">
                    {form.producto_nombre || 'Producto seleccionado'}
                  </span>
                  <button
                    type="button"
                    disabled={destinoBloqueadoPorLink}
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        producto_id: '',
                        producto_nombre: '',
                      }))
                    }
                    className="text-[12px] font-bold text-[var(--accent-deep)]"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                    />
                    <input
                      type="search"
                      value={productQuery}
                      disabled={destinoBloqueadoPorLink}
                      onChange={e => setProductQuery(e.target.value)}
                      placeholder={
                        destinoBloqueadoPorLink
                          ? 'Quita el link manual para buscar producto'
                          : 'Buscar por nombre…'
                      }
                      className="admin-input w-full rounded-xl border py-3 pl-9 pr-4 text-[13px] disabled:opacity-50"
                    />
                  </div>
                  {searchingProducts ? (
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      Buscando…
                    </p>
                  ) : null}
                  <AnimatePresence>
                    {productResults.length > 0 ? (
                      <motion.ul
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]"
                      >
                        {productResults.map(p => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2.5 text-left text-[13px] font-medium hover:bg-[var(--bg-muted)]"
                              onClick={() => {
                                setForm(f => ({
                                  ...f,
                                  producto_id: p.id,
                                  producto_nombre: p.nombre,
                                  enlace_manual: '',
                                }))
                                setProductQuery('')
                                setProductResults([])
                              }}
                            >
                              {p.nombre}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    ) : null}
                  </AnimatePresence>
                </>
              )}
            </div>

            <Input
              label="O link manual"
              type="url"
              value={form.enlace_manual}
              disabled={destinoBloqueadoPorProducto}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  enlace_manual: e.target.value,
                  producto_id: e.target.value.trim() ? '' : f.producto_id,
                  producto_nombre: e.target.value.trim()
                    ? ''
                    : f.producto_nombre,
                }))
              }
              placeholder="https://…"
              hint={
                destinoBloqueadoPorProducto
                  ? 'Quita el producto para usar un link manual'
                  : 'Si no hay producto ni link, el botón solo cierra el modal'
              }
            />
          </div>

          <div className="space-y-3">
            <p className="admin-form-label">Mostrar por</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['3', '3 días'],
                  ['7', '7 días'],
                  ['15', '15 días'],
                  ['30', '30 días'],
                  ['custom', 'Fecha personalizada'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm(f => ({ ...f, duracion: value as DuracionPreset }))
                  }
                  className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors ${
                    form.duracion === value
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                      : 'border-[var(--border)] bg-white text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.duracion === 'custom' ? (
              <Input
                label="Fecha de fin"
                type="date"
                value={form.fecha_fin_custom}
                onChange={e =>
                  setForm(f => ({ ...f, fecha_fin_custom: e.target.value }))
                }
                hint="El anuncio empieza ahora y termina al final de este día"
              />
            ) : (
              <p className="text-[12px] font-medium text-[var(--text-muted)]">
                Al guardar: inicio = ahora · fin = ahora + {form.duracion} días
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                key: 'activo' as const,
                label: 'Activo',
                desc: 'Puede mostrarse en el sitio',
              },
              {
                key: 'mostrar_una_vez_por_sesion' as const,
                label: 'Una vez por sesión',
                desc: 'No repetir en la misma visita',
              },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                className="admin-form-panel flex items-center justify-between px-4 py-3.5"
              >
                <div className="pr-3">
                  <p className="admin-form-panel__title">{label}</p>
                  <p className="admin-form-panel__desc">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className={`admin-toggle ${form[key] ? 'admin-toggle--on' : 'admin-toggle--off'}`}
                  aria-pressed={form[key]}
                >
                  <span className="admin-toggle__thumb" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button fullWidth loading={saving} onClick={() => void handleGuardar()}>
              {selected ? 'Guardar cambios' : 'Crear anuncio'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Eliminar anuncio"
        size="sm"
      >
        <p className="text-[14px] text-[var(--text-secondary)]">
          ¿Eliminar “{selected?.titulo || 'este anuncio'}”? No se podrá
          deshacer.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setDeleteModal(false)}
          >
            Cancelar
          </Button>
          <Button
            fullWidth
            loading={deleting}
            onClick={() => void handleEliminar()}
            className="!bg-[var(--danger)] hover:!opacity-90"
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
