'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { VariacionTipo } from '@/types'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Loader2, Check, Tag } from 'lucide-react'

type VariacionesEditorProps = {
  productoId: string | null
  onChange?: () => void
}

type NuevaOpcionState = {
  nombre: string
  valor_color: string
}

const inputClass = 'admin-input admin-input--compact w-full rounded-xl px-3 py-2 text-[13px] md:rounded-xl'

function colorSwatchStyle(value: string | null | undefined): React.CSSProperties | undefined {
  const v = value?.trim()
  if (!v) return undefined
  return { backgroundColor: v }
}

export default function VariacionesEditor({ productoId, onChange }: VariacionesEditorProps) {
  const [tipos, setTipos] = useState<VariacionTipo[]>([])
  const [loading, setLoading] = useState(false)
  const [newTipoNombre, setNewTipoNombre] = useState('')
  const [addingTipo, setAddingTipo] = useState(false)
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null)
  const [editTipoNombre, setEditTipoNombre] = useState('')
  const [newOpcionByTipo, setNewOpcionByTipo] = useState<Record<string, NuevaOpcionState>>({})

  const notifyChange = () => onChange?.()

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
    } else {
      const sorted = ((data || []) as VariacionTipo[]).map(tipo => ({
        ...tipo,
        opciones: [...(tipo.opciones || [])].sort((a, b) => a.orden - b.orden),
      }))
      setTipos(sorted)
    }
    setLoading(false)
  }, [productoId])

  useEffect(() => {
    if (productoId) fetchTipos()
    else setTipos([])
  }, [productoId, fetchTipos])

  const getNewOpcion = (tipoId: string): NuevaOpcionState =>
    newOpcionByTipo[tipoId] ?? { nombre: '', valor_color: '' }

  const setNewOpcion = (tipoId: string, patch: Partial<NuevaOpcionState>) => {
    setNewOpcionByTipo(prev => ({
      ...prev,
      [tipoId]: { ...getNewOpcion(tipoId), ...patch },
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

    await supabase.from('variacion_opciones').delete().eq('tipo_id', tipo.id)
    const { error } = await supabase.from('variacion_tipos').delete().eq('id', tipo.id)

    if (error) {
      toast.error('Error al eliminar tipo')
      return
    }

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
    const { nombre, valor_color } = getNewOpcion(tipoId)
    const trimmed = nombre.trim()
    if (!trimmed) {
      toast.error('Escribe el nombre de la opción')
      return
    }

    const tipo = tipos.find(t => t.id === tipoId)
    const orden = tipo?.opciones?.length ?? 0
    const colorTrimmed = valor_color.trim()

    const { error } = await supabase.from('variacion_opciones').insert([
      {
        tipo_id: tipoId,
        nombre: trimmed,
        valor_color: colorTrimmed || null,
        disponible: true,
        orden,
      },
    ])

    if (error) {
      toast.error('Error al agregar opción')
      return
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

  const handleEliminarOpcion = async (opcionId: string) => {
    const { error } = await supabase.from('variacion_opciones').delete().eq('id', opcionId)

    if (error) {
      toast.error('Error al eliminar opción')
      return
    }

    toast.success('Opción eliminada')
    await fetchTipos()
    notifyChange()
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
        <p className="admin-form-hint mt-1">Ej: Color → Rubio, Castaño · Tono → Claro, Oscuro</p>
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
                      className="rounded-lg p-2 text-[var(--accent-secondary)] hover:bg-[rgba(232,136,181,0.12)]"
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
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[rgba(232,136,181,0.1)] hover:text-[var(--accent-secondary)]"
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

              <div className="flex flex-wrap items-center gap-2">
                {tipo.opciones && tipo.opciones.length > 0 ? (
                  tipo.opciones.map(opcion => (
                    <div
                      key={opcion.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                        opcion.disponible
                          ? 'border-[rgba(232,136,181,0.3)] bg-[rgba(232,136,181,0.08)]'
                          : 'border-[var(--border-subtle)] bg-[rgba(248,246,241,0.04)] opacity-60'
                      }`}
                    >
                      {opcion.valor_color && (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-[rgba(248,246,241,0.2)]"
                          style={colorSwatchStyle(opcion.valor_color)}
                          title={opcion.valor_color}
                        />
                      )}
                      <span className="text-[12px] text-[var(--text-primary)]">{opcion.nombre}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleDisponible(opcion.id, opcion.disponible)}
                        className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.5px] transition-colors ${
                          opcion.disponible
                            ? 'text-emerald-400 hover:bg-[rgba(74,222,128,0.12)]'
                            : 'text-[var(--text-subtle)] hover:bg-[rgba(248,246,241,0.06)]'
                        }`}
                        title={opcion.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                      >
                        {opcion.disponible ? 'On' : 'Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarOpcion(opcion.id)}
                        className="text-[var(--text-subtle)] hover:text-red-400"
                        aria-label="Eliminar opción"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] font-light italic text-[var(--text-subtle)]">
                    Sin opciones — agrega la primera abajo
                  </p>
                )}
              </div>

              <div className="admin-form-empty mt-3 flex flex-col gap-2 p-3 md:flex-row md:items-end">
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
                      onChange={e => setNewOpcion(tipo.id, { valor_color: e.target.value })}
                      placeholder="#E888B5"
                      className={`${inputClass} py-2`}
                    />
                  </div>
                </div>
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
          ))}
        </div>
      )}

      <div className="admin-form-panel p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[rgba(232,136,181,0.28)] bg-[rgba(232,136,181,0.1)] text-[var(--accent-secondary)]">
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
          El color hex es opcional y sirve para mostrar un círculo de muestra en la tienda.
        </p>
      </div>
    </div>
  )
}
