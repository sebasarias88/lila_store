'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProductoSeccion } from '@/types'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, FileText } from 'lucide-react'

type SeccionesEditorProps = {
  productoId: string | null
}

const inputClass =
  'admin-input admin-input--compact w-full rounded-xl px-3 py-2 text-[13px] md:rounded-xl'

const textareaClass =
  'admin-input admin-input--compact w-full resize-none rounded-xl px-3 py-2 text-[13px] leading-relaxed md:rounded-xl'

export default function SeccionesEditor({ productoId }: SeccionesEditorProps) {
  const [secciones, setSecciones] = useState<ProductoSeccion[]>([])
  const [loading, setLoading] = useState(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchSecciones = useCallback(async () => {
    if (!productoId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('producto_secciones')
      .select('*')
      .eq('producto_id', productoId)
      .order('orden', { ascending: true })

    if (error) {
      toast.error('Error al cargar secciones')
      setSecciones([])
    } else {
      setSecciones((data || []) as ProductoSeccion[])
    }
    setLoading(false)
  }, [productoId])

  useEffect(() => {
    if (productoId) fetchSecciones()
    else setSecciones([])
  }, [productoId, fetchSecciones])

  const updateLocal = (id: string, patch: Partial<ProductoSeccion>) => {
    setSecciones(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  const handleGuardarCampo = async (
    seccion: ProductoSeccion,
    campo: 'titulo' | 'descripcion',
  ) => {
    const { error } = await supabase
      .from('producto_secciones')
      .update({ [campo]: seccion[campo] })
      .eq('id', seccion.id)

    if (error) {
      toast.error('Error al guardar sección')
      return
    }
    toast.success('Sección guardada')
  }

  const handleAgregar = async () => {
    if (!productoId) return
    const titulo = nuevoTitulo.trim()
    if (!titulo) {
      toast.error('Escribe el título de la sección')
      return
    }

    setAdding(true)
    const { error } = await supabase.from('producto_secciones').insert([
      {
        producto_id: productoId,
        titulo,
        descripcion: '',
        orden: secciones.length,
      },
    ])

    if (error) {
      toast.error('Error al agregar sección')
      setAdding(false)
      return
    }

    toast.success('Sección agregada')
    setNuevoTitulo('')
    await fetchSecciones()
    setAdding(false)
  }

  const handleEliminar = async (id: string) => {
    const { error } = await supabase.from('producto_secciones').delete().eq('id', id)

    if (error) {
      toast.error('Error al eliminar sección')
      return
    }

    toast.success('Sección eliminada')
    await fetchSecciones()
  }

  const handleMover = async (index: number, dir: -1 | 1) => {
    const destino = index + dir
    if (destino < 0 || destino >= secciones.length) return

    const actual = secciones[index]
    const vecino = secciones[destino]

    setSecciones(prev => {
      const next = [...prev]
      next[index] = vecino
      next[destino] = actual
      return next
    })

    const [r1, r2] = await Promise.all([
      supabase.from('producto_secciones').update({ orden: destino }).eq('id', actual.id),
      supabase.from('producto_secciones').update({ orden: index }).eq('id', vecino.id),
    ])

    if (r1.error || r2.error) {
      toast.error('Error al reordenar')
      await fetchSecciones()
    }
  }

  if (!productoId) {
    return (
      <div className="admin-form-empty px-4 py-5">
        <p className="text-[13px] text-[var(--text-muted)]">
          Guarda el producto primero para agregar secciones
        </p>
        <p className="admin-form-hint mt-1">
          Ej: Modo de uso · Beneficios · Consecuencias · Ingredientes
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
      ) : secciones.length === 0 ? (
        <p className="admin-form-empty py-4 text-[12px] text-[var(--text-muted)]">
          Aún no hay secciones. Agrega la primera abajo (ej: Modo de uso, Beneficios).
        </p>
      ) : (
        <div className="space-y-3">
          {secciones.map((seccion, index) => (
            <div key={seccion.id} className="admin-form-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[rgba(232,136,181,0.25)] bg-[rgba(232,136,181,0.1)] text-[11px] font-medium text-[var(--accent-secondary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-medium tracking-normal text-[var(--text-subtle)]">
                    Sección
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMover(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[rgba(232,136,181,0.1)] hover:text-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Subir sección"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMover(index, 1)}
                    disabled={index === secciones.length - 1}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[rgba(232,136,181,0.1)] hover:text-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Bajar sección"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(seccion.id)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-red-400"
                    aria-label="Eliminar sección"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="admin-form-label text-[9px] tracking-[0.1em]">
                    Título
                  </label>
                  <input
                    type="text"
                    value={seccion.titulo}
                    onChange={e => updateLocal(seccion.id, { titulo: e.target.value })}
                    onBlur={() => handleGuardarCampo(seccion, 'titulo')}
                    placeholder="Ej: Modo de uso"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="admin-form-label text-[9px] tracking-[0.1em]">
                    Descripción
                  </label>
                  <textarea
                    value={seccion.descripcion}
                    onChange={e => updateLocal(seccion.id, { descripcion: e.target.value })}
                    onBlur={() => handleGuardarCampo(seccion, 'descripcion')}
                    placeholder="Explica el detalle de esta sección..."
                    rows={3}
                    className={textareaClass}
                  />
                </div>
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
          <p className="admin-form-section-title">Nueva sección</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <FileText
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
            />
            <input
              type="text"
              value={nuevoTitulo}
              onChange={e => setNuevoTitulo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAgregar()
                }
              }}
              placeholder="Título — ej: Modo de uso, Beneficios, Ingredientes"
              className="admin-input w-full rounded-xl py-2.5 pl-9 pr-3 text-[13px] md:rounded-xl"
            />
          </div>
          <Button
            type="button"
            onClick={handleAgregar}
            loading={adding}
            className="shrink-0 sm:px-6"
          >
            <Plus size={14} />
            Agregar sección
          </Button>
        </div>
        <p className="admin-form-hint mt-3">
          Se muestran como acordeón debajo del producto en la tienda. La
          descripción la editas en cada tarjeta.
        </p>
      </div>
    </div>
  )
}
