'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Categoria } from '@/types'
import { Input } from '@/components/ui/Input'
import { AdminSelect } from '@/components/ui/AdminSelect'
import Button from '@/components/ui/Button'
import AdminFormLayout from '@/components/admin/mobile/AdminFormLayout'
import toast from 'react-hot-toast'
import { ImageIcon, X, Layers, CornerDownRight } from 'lucide-react'

type CategoriaFormProps = {
  categoria?: Categoria | null
  categoriasRaiz: Categoria[]
  ordenDefault?: number
  onSuccess: () => void
  onCancel: () => void
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-[rgba(169,137,224,0.35)] to-transparent" />
        <h3 className="admin-form-section-title shrink-0">
          {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-[rgba(169,137,224,0.35)] to-transparent" />
      </div>
      {children}
    </section>
  )
}

const generarSlug = (nombre: string) =>
  nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')


function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CategoriaForm({
  categoria,
  categoriasRaiz,
  ordenDefault = 0,
  onSuccess,
  onCancel,
}: CategoriaFormProps) {
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [tipo, setTipo] = useState<'principal' | 'subcategoria'>('principal')
  const [descuentoTab, setDescuentoTab] = useState<'detal' | 'mayoreo'>('detal')
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    imagen_url: '',
    orden: ordenDefault,
    activa: true,
    padre_id: '',
    descuento_porcentaje: 0,
    descuento_activo: false,
    descuento_fecha_fin: '',
    descuento_porcentaje_mayoreo: 0,
    descuento_activo_mayoreo: false,
    descuento_fecha_fin_mayoreo: '',
  })

  useEffect(() => {
    if (categoria) {
      setForm({
        nombre: categoria.nombre,
        slug: categoria.slug,
        imagen_url: categoria.imagen_url || '',
        orden: categoria.orden,
        activa: categoria.activa,
        padre_id: categoria.padre_id || '',
        descuento_porcentaje: categoria.descuento_porcentaje || 0,
        descuento_activo: categoria.descuento_activo || false,
        descuento_fecha_fin: toDatetimeLocal(categoria.descuento_fecha_fin),
        descuento_porcentaje_mayoreo: categoria.descuento_porcentaje_mayoreo || 0,
        descuento_activo_mayoreo: categoria.descuento_activo_mayoreo || false,
        descuento_fecha_fin_mayoreo: toDatetimeLocal(categoria.descuento_fecha_fin_mayoreo),
      })
      setTipo(categoria.padre_id ? 'subcategoria' : 'principal')
    } else {
      setForm({
        nombre: '',
        slug: '',
        imagen_url: '',
        orden: ordenDefault,
        activa: true,
        padre_id: '',
        descuento_porcentaje: 0,
        descuento_activo: false,
        descuento_fecha_fin: '',
        descuento_porcentaje_mayoreo: 0,
        descuento_activo_mayoreo: false,
        descuento_fecha_fin_mayoreo: '',
      })
      setTipo('principal')
      setDescuentoTab('detal')
    }
  }, [categoria, ordenDefault])

  const seleccionarTipo = (nuevoTipo: 'principal' | 'subcategoria') => {
    setTipo(nuevoTipo)
    if (nuevoTipo === 'principal') {
      setForm(f => ({ ...f, padre_id: '' }))
    }
  }

  const handleNombreChange = (nombre: string) => {
    setForm(f => ({
      ...f,
      nombre,
      slug: categoria ? f.slug : generarSlug(nombre),
    }))
  }

  const handleImagenUpload = async (file: File) => {
    setUploadingImg(true)
    const ext = file.name.split('.').pop()
    const path = `categorias/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('productos').upload(path, file, { upsert: true })

    if (error) {
      toast.error('Error al subir imagen')
      setUploadingImg(false)
      return
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(path)
    setForm(f => ({ ...f, imagen_url: data.publicUrl }))
    toast.success('Imagen subida')
    setUploadingImg(false)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (tipo === 'subcategoria' && !form.padre_id) {
      toast.error('Elige dentro de qué categoría va esta subcategoría')
      return
    }

    if (form.descuento_activo && (!form.descuento_porcentaje || form.descuento_porcentaje < 1)) {
      toast.error('Indica un porcentaje de descuento detal entre 1 y 99')
      return
    }
    if (form.descuento_activo_mayoreo && (!form.descuento_porcentaje_mayoreo || form.descuento_porcentaje_mayoreo < 1)) {
      toast.error('Indica un porcentaje de descuento mayorista entre 1 y 99')
      return
    }

    setSaving(true)
    const fechaFinIso = form.descuento_fecha_fin
      ? new Date(form.descuento_fecha_fin).toISOString()
      : null
    const fechaFinMayoreoIso = form.descuento_fecha_fin_mayoreo
      ? new Date(form.descuento_fecha_fin_mayoreo).toISOString()
      : null

    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      imagen_url: form.imagen_url || null,
      orden: form.orden,
      activa: form.activa,
      padre_id: tipo === 'subcategoria' ? form.padre_id || null : null,
      descuento_porcentaje: form.descuento_activo ? form.descuento_porcentaje : 0,
      descuento_activo: form.descuento_activo,
      descuento_fecha_fin: form.descuento_activo ? fechaFinIso : null,
      descuento_porcentaje_mayoreo: form.descuento_activo_mayoreo ? form.descuento_porcentaje_mayoreo : 0,
      descuento_activo_mayoreo: form.descuento_activo_mayoreo,
      descuento_fecha_fin_mayoreo: form.descuento_activo_mayoreo ? fechaFinMayoreoIso : null,
    }

    if (categoria) {
      const { error } = await supabase
        .from('categorias')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', categoria.id)

      if (error) {
        if (error.code === '23505') toast.error('Ya existe una categoría con ese slug')
        else toast.error('Error al actualizar')
        setSaving(false)
        return
      }
      toast.success('Categoría actualizada')
    } else {
      const { error } = await supabase.from('categorias').insert([payload])

      if (error) {
        if (error.code === '23505') toast.error('Ya existe una categoría con ese slug')
        else toast.error('Error al crear categoría')
        setSaving(false)
        return
      }
      toast.success('Categoría creada')
    }

    setSaving(false)
    onSuccess()
  }

  return (
    <AdminFormLayout
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} fullWidth>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} loading={saving} fullWidth>
            {categoria ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      }
    >
      <FormSection title="Información">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={e => handleNombreChange(e.target.value)}
            placeholder="Ej: Shampoo"
          />
          <Input
            label="Slug (URL)"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="shampoo"
            hint="Generado automáticamente al escribir el nombre"
          />
        </div>
      </FormSection>

      <FormSection title="Tipo">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => seleccionarTipo('principal')}
            aria-pressed={tipo === 'principal'}
            className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all md:rounded-xl ${
              tipo === 'principal'
                ? 'border-[rgba(169,137,224,0.5)] bg-[rgba(169,137,224,0.1)] shadow-[inset_0_1px_0_rgba(169,137,224,0.12)]'
                : 'border-[var(--border-input)] bg-[var(--bg-card)] hover:border-[rgba(169,137,224,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                  tipo === 'principal'
                    ? 'border-[rgba(169,137,224,0.4)] bg-[rgba(169,137,224,0.18)] text-[var(--accent-secondary)]'
                    : 'border-[var(--border-input)] text-[var(--text-muted)]'
                }`}
              >
                <Layers size={15} />
              </span>
              <span
                className={`text-[12px] font-medium uppercase tracking-[1px] ${
                  tipo === 'principal' ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                Categoría principal
              </span>
            </div>
            <p className="text-[11px] font-light leading-relaxed text-[var(--text-muted)]">
              Aparece como una sección principal de la tienda. Puede agrupar
              subcategorías dentro.
            </p>
          </button>

          <button
            type="button"
            onClick={() => seleccionarTipo('subcategoria')}
            aria-pressed={tipo === 'subcategoria'}
            className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all md:rounded-xl ${
              tipo === 'subcategoria'
                ? 'border-[rgba(169,137,224,0.5)] bg-[rgba(169,137,224,0.1)] shadow-[inset_0_1px_0_rgba(169,137,224,0.12)]'
                : 'border-[var(--border-input)] bg-[var(--bg-card)] hover:border-[rgba(169,137,224,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                  tipo === 'subcategoria'
                    ? 'border-[rgba(169,137,224,0.4)] bg-[rgba(169,137,224,0.18)] text-[var(--accent-secondary)]'
                    : 'border-[var(--border-input)] text-[var(--text-muted)]'
                }`}
              >
                <CornerDownRight size={15} />
              </span>
              <span
                className={`text-[12px] font-medium uppercase tracking-[1px] ${
                  tipo === 'subcategoria' ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                Subcategoría
              </span>
            </div>
            <p className="text-[11px] font-light leading-relaxed text-[var(--text-muted)]">
              Va agrupada dentro de una categoría principal (ej: “Shampoo”
              dentro de “Cabello”).
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tipo === 'subcategoria' && (
            <div className="space-y-1.5">
              <label className="admin-form-label">Dentro de la categoría *</label>
              <AdminSelect
                value={form.padre_id}
                onChange={padre_id => setForm(f => ({ ...f, padre_id }))}
                groups={[
                  {
                    label: 'Categorías principales',
                    options: categoriasRaiz
                      .filter(c => c.id !== categoria?.id)
                      .map(c => ({ value: c.id, label: c.nombre })),
                  },
                ]}
                placeholder="Selecciona la categoría principal"
              />
              <p className="admin-form-hint">
                Esta subcategoría aparecerá agrupada aquí
              </p>
            </div>
          )}
          <Input
            label="Orden de aparición"
            type="number"
            value={form.orden}
            onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))}
            hint="Menor número = aparece primero"
          />
        </div>
      </FormSection>

      <FormSection title="Imagen">
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          {form.imagen_url ? (
            <div className="relative mx-auto h-36 w-36 shrink-0 md:mx-0 md:h-[9.5rem] md:w-[9.5rem]">
              <div className="h-full w-full overflow-hidden rounded-xl border border-[rgba(169,137,224,0.2)] bg-white md:rounded-xl">
                <img
                  src={form.imagen_url}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(169,137,224,0.3)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-colors hover:border-red-400/50 hover:text-red-400"
                aria-label="Quitar imagen"
              >
                <X size={12} />
              </button>
            </div>
          ) : null}
          <label className="flex min-w-0 flex-1 cursor-pointer flex-col">
            <div className="admin-upload-zone min-h-[10rem] md:min-h-[9.5rem]">
              {uploadingImg ? (
                <p className="animate-pulse text-[12px] text-[var(--text-muted)]">
                  Subiendo imagen...
                </p>
              ) : (
                <>
                  <ImageIcon size={20} className="mx-auto mb-2 text-[rgba(169,137,224,0.72)]" />
                  <p className="admin-upload-zone__title">
                    {form.imagen_url ? 'Cambiar imagen' : 'Subir imagen de categoría'}
                  </p>
                  <p className="admin-upload-zone__meta">JPG, PNG o WebP — opcional</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingImg}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleImagenUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </FormSection>

      <FormSection title="Visibilidad">
        <div className="admin-form-panel flex items-center justify-between px-4 py-3.5">
          <div className="pr-4">
            <p className="admin-form-panel__title">Categoría activa</p>
            <p className="admin-form-panel__desc">Las inactivas no aparecen en la tienda</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
            className={`admin-toggle ${form.activa ? 'admin-toggle--on' : 'admin-toggle--off'}`}
            aria-pressed={form.activa}
          >
            <span className="admin-toggle__thumb" />
          </button>
        </div>
      </FormSection>

      <FormSection title="Descuentos por catálogo">
        <div className="space-y-4">
          <div className="flex overflow-hidden rounded-xl border border-[var(--border-input)]">
            {([
              { id: 'detal' as const, label: 'Catálogo Detal' },
              { id: 'mayoreo' as const, label: 'Catálogo Mayorista' },
            ]).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDescuentoTab(tab.id)}
                className={`flex-1 py-2.5 text-[10px] font-medium tracking-normal transition-all ${
                  descuentoTab === tab.id
                    ? 'bg-[var(--bg-muted)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {descuentoTab === 'detal' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-form-panel space-y-4 px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="pr-4">
                  <p className="admin-form-panel__title">Activar descuento detal</p>
                  <p className="admin-form-panel__desc">
                    Aplica a productos de esta categoría en el catálogo detal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, descuento_activo: !f.descuento_activo }))}
                  className={`admin-toggle ${form.descuento_activo ? 'admin-toggle--on' : 'admin-toggle--off'}`}
                  aria-pressed={form.descuento_activo}
                >
                  <span className="admin-toggle__thumb" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {form.descuento_activo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <Input
                        label="Porcentaje descuento detal"
                        type="number"
                        min={1}
                        max={99}
                        value={form.descuento_porcentaje || ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            descuento_porcentaje: Math.min(99, Math.max(0, Number(e.target.value) || 0)),
                          }))
                        }
                        placeholder="Ej: 10"
                        hint="Ingresa un número entre 1 y 99"
                      />
                      <span className="pointer-events-none absolute right-4 top-[2.15rem] text-[13px] font-light text-[var(--text-subtle)]">
                        %
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="admin-form-label">Fecha de vencimiento detal (opcional)</label>
                      <input
                        type="datetime-local"
                        value={form.descuento_fecha_fin}
                        onChange={e => setForm(f => ({ ...f, descuento_fecha_fin: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-card)] px-4 py-3 text-[13px] font-light text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)]"
                      />
                      <p className="admin-form-hint">Si no defines fecha, el descuento no expira</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {descuentoTab === 'mayoreo' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-form-panel space-y-4 px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="pr-4">
                  <p className="admin-form-panel__title">Activar descuento mayorista</p>
                  <p className="admin-form-panel__desc">
                    Aplica a productos de esta categoría en el catálogo mayorista
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm(f => ({ ...f, descuento_activo_mayoreo: !f.descuento_activo_mayoreo }))
                  }
                  className={`admin-toggle ${form.descuento_activo_mayoreo ? 'admin-toggle--on' : 'admin-toggle--off'}`}
                  aria-pressed={form.descuento_activo_mayoreo}
                >
                  <span className="admin-toggle__thumb" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {form.descuento_activo_mayoreo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <Input
                        label="Porcentaje descuento mayorista"
                        type="number"
                        min={1}
                        max={99}
                        value={form.descuento_porcentaje_mayoreo || ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            descuento_porcentaje_mayoreo: Math.min(
                              99,
                              Math.max(0, Number(e.target.value) || 0),
                            ),
                          }))
                        }
                        placeholder="Ej: 15"
                        hint="Ingresa un número entre 1 y 99"
                      />
                      <span className="pointer-events-none absolute right-4 top-[2.15rem] text-[13px] font-light text-[var(--text-subtle)]">
                        %
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="admin-form-label">Fecha de vencimiento mayorista (opcional)</label>
                      <input
                        type="datetime-local"
                        value={form.descuento_fecha_fin_mayoreo}
                        onChange={e =>
                          setForm(f => ({ ...f, descuento_fecha_fin_mayoreo: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-card)] px-4 py-3 text-[13px] font-light text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)]"
                      />
                      <p className="admin-form-hint">Si no defines fecha, el descuento no expira</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </FormSection>
    </AdminFormLayout>
  )
}
