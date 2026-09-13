'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { optimizeImage } from '@/lib/optimizeImage'
import { formatCopInput, parseCopInput, sanitizeCopInput } from '@/lib/currency'
import { VariacionOpcion, VariacionTipo } from '@/types'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Loader2, Check, Tag, ImagePlus } from 'lucide-react'

type VariacionesEditorProps = {
  productoId: string | null
  onChange?: () => void
}

type OpcionPreciosFields = {
  precio: string
  precio_antes: string
  precio_mayoreo: string
  precio_antes_mayoreo: string
}

type NuevaOpcionState = OpcionPreciosFields & {
  nombre: string
  valor_color: string
  imagenFile: File | null
}

const EMPTY_PRECIOS: OpcionPreciosFields = {
  precio: '',
  precio_antes: '',
  precio_mayoreo: '',
  precio_antes_mayoreo: '',
}

const MAX_IMG_BYTES = 5 * 1024 * 1024

function pathInProductosBucket(url: string): string | null {
  const marker = '/object/public/productos/'
  const idx = url.indexOf(marker)
  if (idx < 0) return null
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
}

async function removeFromProductosBucket(url: string | null | undefined) {
  if (!url) return
  const path = pathInProductosBucket(url)
  if (path) await supabase.storage.from('productos').remove([path])
}

const inputClass = 'admin-input admin-input--compact w-full rounded-xl px-3 py-2 text-[13px] md:rounded-xl'

function colorSwatchStyle(value: string | null | undefined): React.CSSProperties | undefined {
  const v = value?.trim()
  if (!v) return undefined
  return { backgroundColor: v }
}

function preciosFromOpcion(opcion: VariacionOpcion): OpcionPreciosFields {
  return {
    precio: opcion.precio != null ? formatCopInput(opcion.precio) : '',
    precio_antes: opcion.precio_antes != null ? formatCopInput(opcion.precio_antes) : '',
    precio_mayoreo:
      opcion.precio_mayoreo != null ? formatCopInput(opcion.precio_mayoreo) : '',
    precio_antes_mayoreo:
      opcion.precio_antes_mayoreo != null
        ? formatCopInput(opcion.precio_antes_mayoreo)
        : '',
  }
}

function preciosPayload(fields: OpcionPreciosFields) {
  return {
    precio: parseCopInput(fields.precio),
    precio_antes: parseCopInput(fields.precio_antes),
    precio_mayoreo: parseCopInput(fields.precio_mayoreo),
    precio_antes_mayoreo: parseCopInput(fields.precio_antes_mayoreo),
  }
}

function preciosIguales(a: OpcionPreciosFields, b: OpcionPreciosFields) {
  return (
    a.precio === b.precio &&
    a.precio_antes === b.precio_antes &&
    a.precio_mayoreo === b.precio_mayoreo &&
    a.precio_antes_mayoreo === b.precio_antes_mayoreo
  )
}

function PrecioField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="min-w-0 space-y-1">
      <label className="admin-form-label text-[9px] tracking-[0.1em]">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={e => onChange(sanitizeCopInput(e.target.value))}
        onBlur={() => {
          const parsed = parseCopInput(value)
          if (parsed !== null) onChange(formatCopInput(parsed))
        }}
        placeholder="Vacío = producto"
        className={inputClass}
      />
    </div>
  )
}

export default function VariacionesEditor({ productoId, onChange }: VariacionesEditorProps) {
  const [tipos, setTipos] = useState<VariacionTipo[]>([])
  const [loading, setLoading] = useState(false)
  const [newTipoNombre, setNewTipoNombre] = useState('')
  const [addingTipo, setAddingTipo] = useState(false)
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null)
  const [editTipoNombre, setEditTipoNombre] = useState('')
  const [newOpcionByTipo, setNewOpcionByTipo] = useState<Record<string, NuevaOpcionState>>({})
  const [preciosByOpcion, setPreciosByOpcion] = useState<Record<string, OpcionPreciosFields>>({})
  const [savingPreciosId, setSavingPreciosId] = useState<string | null>(null)
  const [uploadingOpcionId, setUploadingOpcionId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetIdRef = useRef<string | null>(null)

  const notifyChange = () => onChange?.()

  const uploadOpcionFile = async (file: File, opcionId: string): Promise<string | null> => {
    if (!productoId) return null
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return null
    }
    if (file.size > MAX_IMG_BYTES) {
      toast.error('La imagen no puede superar 5MB')
      return null
    }

    const optimized = await optimizeImage(file)
    if (!optimized.ok) {
      toast.error(optimized.message)
      return null
    }
    const toUpload = optimized.file
    const ext = toUpload.name.split('.').pop()?.toLowerCase() || 'webp'
    const path = `variaciones/${productoId}/${opcionId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('productos').upload(path, toUpload, {
      upsert: true,
      contentType: toUpload.type || 'image/webp',
    })
    if (error) return null

    const { data } = supabase.storage.from('productos').getPublicUrl(path)
    return data.publicUrl
  }

  const fetchTipos = useCallback(async () => {
    if (!productoId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('variacion_tipos')
      .select('*, opciones:variacion_opciones(*)')
      .eq('producto_id', productoId)
      .order('orden', { ascending: true })

    if (error) {
      toast.error('Error al cargar variaciones')
      setTipos([])
      setPreciosByOpcion({})
    } else {
      const sorted = ((data || []) as VariacionTipo[]).map(tipo => ({
        ...tipo,
        opciones: [...(tipo.opciones || [])].sort((a, b) => a.orden - b.orden),
      }))
      setTipos(sorted)
      const nextPrecios: Record<string, OpcionPreciosFields> = {}
      for (const tipo of sorted) {
        for (const opcion of tipo.opciones || []) {
          nextPrecios[opcion.id] = preciosFromOpcion(opcion)
        }
      }
      setPreciosByOpcion(nextPrecios)
    }
    setLoading(false)
  }, [productoId])

  useEffect(() => {
    if (productoId) fetchTipos()
    else {
      setTipos([])
      setPreciosByOpcion({})
    }
  }, [productoId, fetchTipos])

  const getNewOpcion = (tipoId: string): NuevaOpcionState =>
    newOpcionByTipo[tipoId] ?? {
      nombre: '',
      valor_color: '',
      imagenFile: null,
      ...EMPTY_PRECIOS,
    }

  const setNewOpcion = (tipoId: string, patch: Partial<NuevaOpcionState>) => {
    setNewOpcionByTipo(prev => ({
      ...prev,
      [tipoId]: { ...getNewOpcion(tipoId), ...patch },
    }))
  }

  const patchOpcionPrecios = (opcionId: string, patch: Partial<OpcionPreciosFields>) => {
    setPreciosByOpcion(prev => ({
      ...prev,
      [opcionId]: { ...(prev[opcionId] ?? EMPTY_PRECIOS), ...patch },
    }))
  }

  const handleAgregarTipo = async () => {
    if (!productoId) return
    const nombre = newTipoNombre.trim()
    if (!nombre) {
      toast.error('Escribe el nombre del tipo de variación')
      return
    }

    setAddingTipo(true)
    const orden = tipos.length
    const { error } = await supabase
      .from('variacion_tipos')
      .insert([{ producto_id: productoId, nombre, orden }])

    if (error) {
      toast.error('Error al crear tipo de variación')
      setAddingTipo(false)
      return
    }

    toast.success('Tipo de variación agregado')
    setNewTipoNombre('')
    await fetchTipos()
    notifyChange()
    setAddingTipo(false)
  }

  const handleEliminarTipo = async (tipo: VariacionTipo) => {
    if (!confirm(`¿Eliminar el tipo "${tipo.nombre}" y todas sus opciones?`)) return

    const imagenes = (tipo.opciones || []).map(o => o.imagen_url).filter(Boolean) as string[]
    await supabase.from('variacion_opciones').delete().eq('tipo_id', tipo.id)
    const { error } = await supabase.from('variacion_tipos').delete().eq('id', tipo.id)

    if (error) {
      toast.error('Error al eliminar tipo')
      return
    }

    await Promise.all(imagenes.map(url => removeFromProductosBucket(url)))

    toast.success('Tipo eliminado')
    await fetchTipos()
    notifyChange()
  }

  const handleGuardarNombreTipo = async (tipoId: string) => {
    const nombre = editTipoNombre.trim()
    if (!nombre) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    const { error } = await supabase.from('variacion_tipos').update({ nombre }).eq('id', tipoId)

    if (error) {
      toast.error('Error al actualizar tipo')
      return
    }

    toast.success('Tipo actualizado')
    setEditingTipoId(null)
    await fetchTipos()
    notifyChange()
  }

  const handleAgregarOpcion = async (tipoId: string) => {
    const draft = getNewOpcion(tipoId)
    const trimmed = draft.nombre.trim()
    if (!trimmed) {
      toast.error('Escribe el nombre de la opción')
      return
    }

    const tipo = tipos.find(t => t.id === tipoId)
    const orden = tipo?.opciones?.length ?? 0
    const colorTrimmed = draft.valor_color.trim()
    const precios = preciosPayload(draft)

    const { data, error } = await supabase
      .from('variacion_opciones')
      .insert([
        {
          tipo_id: tipoId,
          nombre: trimmed,
          valor_color: colorTrimmed || null,
          disponible: true,
          orden,
          ...precios,
        },
      ])
      .select('id')
      .single()

    if (error || !data) {
      toast.error('Error al agregar opción')
      return
    }

    const imagenFile = draft.imagenFile
    if (imagenFile) {
      setUploadingOpcionId(data.id)
      const url = await uploadOpcionFile(imagenFile, data.id)
      if (url) {
        const { error: imgError } = await supabase
          .from('variacion_opciones')
          .update({ imagen_url: url })
          .eq('id', data.id)
        if (imgError) toast.error('La opción se creó, pero no se guardó la foto')
      } else {
        toast.error('La opción se creó, pero no se subió la foto')
      }
      setUploadingOpcionId(null)
    }

    toast.success('Opción agregada')
    setNewOpcionByTipo(prev => {
      const next = { ...prev }
      delete next[tipoId]
      return next
    })
    await fetchTipos()
    notifyChange()
  }

  const handleGuardarPreciosOpcion = async (opcion: VariacionOpcion) => {
    const draft = preciosByOpcion[opcion.id] ?? preciosFromOpcion(opcion)
    const baseline = preciosFromOpcion(opcion)
    if (preciosIguales(draft, baseline)) return

    setSavingPreciosId(opcion.id)
    const { error } = await supabase
      .from('variacion_opciones')
      .update(preciosPayload(draft))
      .eq('id', opcion.id)

    if (error) {
      toast.error('Error al guardar precios de la opción')
      setSavingPreciosId(null)
      return
    }

    toast.success('Precios de opción guardados')
    setSavingPreciosId(null)
    await fetchTipos()
    notifyChange()
  }

  const handleEliminarOpcion = async (opcion: VariacionOpcion) => {
    const { error } = await supabase.from('variacion_opciones').delete().eq('id', opcion.id)

    if (error) {
      toast.error('Error al eliminar opción')
      return
    }

    await removeFromProductosBucket(opcion.imagen_url)
    toast.success('Opción eliminada')
    await fetchTipos()
    notifyChange()
  }

  const handleOpcionImagen = async (opcion: VariacionOpcion, file: File) => {
    setUploadingOpcionId(opcion.id)
    const url = await uploadOpcionFile(file, opcion.id)
    if (!url) {
      toast.error('Error al subir la foto')
      setUploadingOpcionId(null)
      return
    }

    const { error } = await supabase
      .from('variacion_opciones')
      .update({ imagen_url: url })
      .eq('id', opcion.id)

    if (error) {
      await removeFromProductosBucket(url)
      toast.error('Error al guardar la foto')
      setUploadingOpcionId(null)
      return
    }

    if (opcion.imagen_url && opcion.imagen_url !== url) {
      await removeFromProductosBucket(opcion.imagen_url)
    }

    toast.success('Foto de la opción actualizada')
    setUploadingOpcionId(null)
    await fetchTipos()
    notifyChange()
  }

  const handleQuitarImagenOpcion = async (opcion: VariacionOpcion) => {
    if (!opcion.imagen_url) return

    const { error } = await supabase
      .from('variacion_opciones')
      .update({ imagen_url: null })
      .eq('id', opcion.id)

    if (error) {
      toast.error('Error al quitar la foto')
      return
    }

    await removeFromProductosBucket(opcion.imagen_url)
    toast.success('Foto quitada')
    await fetchTipos()
    notifyChange()
  }

  const pickOpcionImagen = (opcionId: string) => {
    uploadTargetIdRef.current = opcionId
    fileInputRef.current?.click()
  }

  const onHiddenFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const opcionId = uploadTargetIdRef.current
    e.target.value = ''
    uploadTargetIdRef.current = null
    if (!file || !opcionId) return

    const opcion = tipos.flatMap(t => t.opciones || []).find(o => o.id === opcionId)
    if (!opcion) return
    await handleOpcionImagen(opcion, file)
  }

  const handleToggleDisponible = async (opcionId: string, disponible: boolean) => {
    const { error } = await supabase
      .from('variacion_opciones')
      .update({ disponible: !disponible })
      .eq('id', opcionId)

    if (error) {
      toast.error('Error al actualizar disponibilidad')
      return
    }

    await fetchTipos()
    notifyChange()
  }

  if (!productoId) {
    return (
      <div className="admin-form-empty px-4 py-5">
        <p className="text-[13px] text-[var(--text-muted)]">
          Guarda el producto primero para agregar variaciones
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
          <Loader2 size={20} className="animate-spin text-[var(--accent-secondary)]" />
        </div>
      ) : tipos.length === 0 ? (
        <p className="admin-form-empty py-4 text-[12px] text-[var(--text-muted)]">
          Aún no hay tipos de variación. Agrega el primero abajo.
        </p>
      ) : (
        <div className="space-y-3">
          {tipos.map(tipo => (
            <div key={tipo.id} className="admin-form-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                {editingTipoId === tipo.id ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      value={editTipoNombre}
                      onChange={e => setEditTipoNombre(e.target.value)}
                      className={`${inputClass} flex-1 py-2`}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleGuardarNombreTipo(tipo.id)
                        if (e.key === 'Escape') setEditingTipoId(null)
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleGuardarNombreTipo(tipo.id)}
                      className="rounded-lg p-2 text-[var(--accent-secondary)] hover:bg-[rgba(169,137,224,0.12)]"
                      aria-label="Guardar nombre"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <h4 className="text-[13px] font-medium uppercase tracking-[1px] text-[var(--text-primary)]">
                    {tipo.nombre}
                  </h4>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTipoId(tipo.id)
                      setEditTipoNombre(tipo.nombre)
                    }}
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[rgba(169,137,224,0.1)] hover:text-[var(--accent-secondary)]"
                    aria-label="Editar tipo"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarTipo(tipo)}
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[rgba(248,113,113,0.1)] hover:text-red-400"
                    aria-label="Eliminar tipo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {tipo.opciones && tipo.opciones.length > 0 ? (
                  tipo.opciones.map(opcion => {
                    const draft =
                      preciosByOpcion[opcion.id] ?? preciosFromOpcion(opcion)
                    const dirty = !preciosIguales(draft, preciosFromOpcion(opcion))
                    const saving = savingPreciosId === opcion.id

                    return (
                      <div
                        key={opcion.id}
                        className={`rounded-xl border p-3 ${
                          opcion.disponible
                            ? 'border-[rgba(169,137,224,0.3)] bg-[rgba(169,137,224,0.06)]'
                            : 'border-[var(--border-subtle)] bg-[rgba(248,246,241,0.04)] opacity-70'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[rgba(169,137,224,0.28)] bg-[rgba(248,246,241,0.06)]">
                            {uploadingOpcionId === opcion.id ? (
                              <span className="flex h-full w-full items-center justify-center">
                                <Loader2
                                  size={14}
                                  className="animate-spin text-[var(--accent-secondary)]"
                                />
                              </span>
                            ) : opcion.imagen_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={opcion.imagen_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : opcion.valor_color ? (
                              <span
                                className="block h-full w-full"
                                style={colorSwatchStyle(opcion.valor_color)}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[var(--text-subtle)]">
                                <ImagePlus size={14} />
                              </span>
                            )}
                          </div>
                          <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--text-primary)]">
                            {opcion.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => pickOpcionImagen(opcion.id)}
                            className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.5px] text-[var(--accent-secondary)] hover:bg-[rgba(169,137,224,0.12)]"
                            title={opcion.imagen_url ? 'Cambiar foto' : 'Subir foto'}
                          >
                            Foto
                          </button>
                          {opcion.imagen_url && (
                            <button
                              type="button"
                              onClick={() => handleQuitarImagenOpcion(opcion)}
                              className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.5px] text-[var(--text-subtle)] hover:bg-[rgba(248,113,113,0.1)] hover:text-red-400"
                              title="Quitar foto"
                            >
                              Quitar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleDisponible(opcion.id, opcion.disponible)
                            }
                            className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.5px] transition-colors ${
                              opcion.disponible
                                ? 'text-emerald-400 hover:bg-[rgba(74,222,128,0.12)]'
                                : 'text-[var(--text-subtle)] hover:bg-[rgba(248,246,241,0.06)]'
                            }`}
                            title={
                              opcion.disponible
                                ? 'Marcar no disponible'
                                : 'Marcar disponible'
                            }
                          >
                            {opcion.disponible ? 'On' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarOpcion(opcion)}
                            className="text-[var(--text-subtle)] hover:text-red-400"
                            aria-label="Eliminar opción"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                          <PrecioField
                            label="Precio detal"
                            value={draft.precio}
                            onChange={v => patchOpcionPrecios(opcion.id, { precio: v })}
                          />
                          <PrecioField
                            label="Antes detal"
                            value={draft.precio_antes}
                            onChange={v =>
                              patchOpcionPrecios(opcion.id, { precio_antes: v })
                            }
                          />
                          <PrecioField
                            label="Precio mayoreo"
                            value={draft.precio_mayoreo}
                            onChange={v =>
                              patchOpcionPrecios(opcion.id, { precio_mayoreo: v })
                            }
                          />
                          <PrecioField
                            label="Antes mayoreo"
                            value={draft.precio_antes_mayoreo}
                            onChange={v =>
                              patchOpcionPrecios(opcion.id, {
                                precio_antes_mayoreo: v,
                              })
                            }
                          />
                        </div>

                        {dirty && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              loading={saving}
                              onClick={() => handleGuardarPreciosOpcion(opcion)}
                            >
                              Guardar precios
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[11px] font-light italic text-[var(--text-subtle)]">
                    Sin opciones — agrega la primera abajo
                  </p>
                )}
              </div>

              <div className="admin-form-empty mt-3 space-y-3 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <label className="admin-form-label text-[9px] tracking-[0.1em]">
                      Nombre de la opción
                    </label>
                    <input
                      type="text"
                      value={getNewOpcion(tipo.id).nombre}
                      onChange={e => setNewOpcion(tipo.id, { nombre: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAgregarOpcion(tipo.id)
                        }
                      }}
                      placeholder="Ej: Rubio, 500ml, Claro"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full space-y-1 md:w-36">
                    <label className="admin-form-label text-[9px] tracking-[0.1em]">
                      Color hex (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      {getNewOpcion(tipo.id).valor_color.trim() && (
                        <span
                          className="h-8 w-8 shrink-0 rounded-full border border-[rgba(248,246,241,0.2)]"
                          style={colorSwatchStyle(getNewOpcion(tipo.id).valor_color)}
                        />
                      )}
                      <input
                        type="text"
                        value={getNewOpcion(tipo.id).valor_color}
                        onChange={e =>
                          setNewOpcion(tipo.id, { valor_color: e.target.value })
                        }
                        placeholder="#A989E0"
                        className={`${inputClass} py-2`}
                      />
                    </div>
                  </div>
                  <div className="w-full space-y-1 md:w-40">
                    <label className="admin-form-label text-[9px] tracking-[0.1em]">
                      Foto (opcional)
                    </label>
                    <label className="admin-input admin-input--compact flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-[var(--text-muted)]">
                      <ImagePlus size={14} className="shrink-0 text-[var(--accent-secondary)]" />
                      <span className="min-w-0 truncate">
                        {getNewOpcion(tipo.id).imagenFile
                          ? getNewOpcion(tipo.id).imagenFile!.name
                          : 'Elegir imagen'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e =>
                          setNewOpcion(tipo.id, {
                            imagenFile: e.target.files?.[0] ?? null,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <PrecioField
                    label="Precio detal"
                    value={getNewOpcion(tipo.id).precio}
                    onChange={v => setNewOpcion(tipo.id, { precio: v })}
                  />
                  <PrecioField
                    label="Antes detal"
                    value={getNewOpcion(tipo.id).precio_antes}
                    onChange={v => setNewOpcion(tipo.id, { precio_antes: v })}
                  />
                  <PrecioField
                    label="Precio mayoreo"
                    value={getNewOpcion(tipo.id).precio_mayoreo}
                    onChange={v => setNewOpcion(tipo.id, { precio_mayoreo: v })}
                  />
                  <PrecioField
                    label="Antes mayoreo"
                    value={getNewOpcion(tipo.id).precio_antes_mayoreo}
                    onChange={v => setNewOpcion(tipo.id, { precio_antes_mayoreo: v })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAgregarOpcion(tipo.id)}
                    className="shrink-0"
                  >
                    <Plus size={13} />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-form-panel p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[rgba(169,137,224,0.28)] bg-[rgba(169,137,224,0.1)] text-[var(--accent-secondary)]">
            <Plus size={15} />
          </span>
          <p className="admin-form-section-title">Nuevo tipo de variación</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <Tag
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
            />
            <input
              id="nuevo-tipo-variacion"
              type="text"
              value={newTipoNombre}
              onChange={e => setNewTipoNombre(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAgregarTipo()
              }}
              placeholder="Nombre del tipo — ej: Color, Tono, Tamaño"
              className="admin-input w-full rounded-xl py-2.5 pl-9 pr-3 text-[13px] md:rounded-xl"
            />
          </div>
          <Button
            type="button"
            onClick={handleAgregarTipo}
            loading={addingTipo}
            className="shrink-0 sm:px-6"
          >
            <Plus size={14} />
            Agregar tipo
          </Button>
        </div>
        <p className="admin-form-hint mt-3">
          Precio vacío en una opción = hereda el precio del producto. Si varias opciones tienen
          precio, gana la del tipo con mayor orden (ej. Tamaño).
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onHiddenFileChange}
      />
    </div>
  )
}
