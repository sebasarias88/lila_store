'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Loader2, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatTelefonoDisplay } from '@/lib/negocio'

type StoreRow = {
  id: string
  ciudad: string
  direccion: string
  telefono: string | null
  nota: string | null
  orden: number
  activa: boolean
}

type FormState = { ciudad: string; direccion: string; telefono: string; nota: string }
type FormErrors = Partial<Record<keyof FormState, string>>

const EMPTY_FORM: FormState = { ciudad: '', direccion: '', telefono: '', nota: '' }

/** Which control is busy, so only that one shows a spinner. */
type Pending = { id: string; action: 'toggle' | 'up' | 'down' } | null

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (form.ciudad.trim().length < 2) errors.ciudad = 'Escribe la ciudad (ej. Armenia, Quindío)'
  if (form.direccion.trim().length < 3) errors.direccion = 'Escribe la dirección'
  const digits = form.telefono.replace(/\D/g, '')
  if (digits && (digits.length < 7 || digits.length > 12)) {
    errors.telefono = 'Número no válido (ej. 3101234567)'
  }
  if (form.nota.length > 120) errors.nota = 'Máximo 120 caracteres'
  return errors
}

export default function SucursalesAdminPage() {
  const [rows, setRows] = useState<StoreRow[] | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [editing, setEditing] = useState<StoreRow | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<StoreRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, ciudad, direccion, telefono, nota, orden, activa')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      toast.error('No pudimos cargar las sucursales')
      setRows([])
      return
    }
    setRows(data as StoreRow[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditing('new')
  }

  const openEdit = (row: StoreRow) => {
    setForm({
      ciudad: row.ciudad,
      direccion: row.direccion,
      telefono: row.telefono ?? '',
      nota: row.nota ?? '',
    })
    setErrors({})
    setEditing(row)
  }

  const save = async () => {
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = {
      ciudad: form.ciudad.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.replace(/\D/g, '') || null,
      nota: form.nota.trim() || null,
    }

    setSaving(true)
    const { error } =
      editing === 'new'
        ? await supabase.from('sucursales').insert({
            ...payload,
            orden: Math.max(0, ...(rows ?? []).map(r => r.orden)) + 1,
          })
        : await supabase.from('sucursales').update(payload).eq('id', (editing as StoreRow).id)

    if (error) {
      setSaving(false)
      toast.error('No se pudo guardar. Intenta de nuevo.')
      return
    }
    await load()
    setSaving(false)
    setEditing(null)
    toast.success(editing === 'new' ? 'Sucursal agregada' : 'Sucursal actualizada')
  }

  const toggle = async (row: StoreRow) => {
    setPending({ id: row.id, action: 'toggle' })
    const { error } = await supabase
      .from('sucursales')
      .update({ activa: !row.activa })
      .eq('id', row.id)
    if (error) toast.error('No se pudo cambiar la visibilidad')
    await load()
    setPending(null)
  }

  const move = async (index: number, dir: -1 | 1) => {
    if (!rows) return
    const a = rows[index]
    const b = rows[index + dir]
    if (!a || !b) return
    setPending({ id: a.id, action: dir === -1 ? 'up' : 'down' })
    // Positions 1..n by current order, then swap the two rows.
    const ordered = rows.map((r, i) => ({ id: r.id, orden: i + 1 }))
    ordered[index].orden = index + dir + 1
    ordered[index + dir].orden = index + 1
    const results = await Promise.all(
      ordered
        .filter((o, i) => rows[i].orden !== o.orden)
        .map(o => supabase.from('sucursales').update({ orden: o.orden }).eq('id', o.id)),
    )
    if (results.some(r => r.error)) toast.error('No se pudo cambiar el orden')
    await load()
    setPending(null)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    const { error } = await supabase.from('sucursales').delete().eq('id', toDelete.id)
    if (error) {
      setDeleting(false)
      toast.error('No se pudo eliminar')
      return
    }
    await load()
    setDeleting(false)
    setToDelete(null)
    toast.success('Sucursal eliminada')
  }

  const busy = pending !== null
  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }))
    },
    error: errors[key],
  })

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-5 sm:p-8 lg:p-10">
      <header className="mb-8 flex flex-col gap-4 border-b border-[rgba(169,137,224,0.16)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-bold text-[var(--accent-deep)]">Gestión</p>
          <h1 className="mt-1 text-[26px] font-extrabold text-[var(--text-primary)]">Sucursales</h1>
          <p className="mt-1 max-w-xl text-[13px] text-[var(--text-secondary)]">
            Las tiendas que aparecen en el pie de página, en &quot;Nosotros&quot; y en
            &quot;Recoger en tienda&quot;. Si te cambias de local, actualízalo aquí.
          </p>
        </div>
        <Button onClick={openNew} disabled={busy}>
          <Plus size={14} aria-hidden /> Agregar sucursal
        </Button>
      </header>

      {rows === null ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <span role="status" className="sr-only">Cargando sucursales…</span>
          {[0, 1].map(i => (
            <div
              key={i}
              className="h-[148px] rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <MapPin className="mx-auto text-[var(--accent-primary)]" aria-hidden />
          <p className="mt-3 text-[14px] font-bold text-[var(--text-primary)]">Aún no hay sucursales</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Sin sucursales, la opción &quot;Recoger en tienda&quot; no tendrá tiendas para elegir.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((row, index) => {
            const isPending = (action: NonNullable<Pending>['action']) =>
              pending?.id === row.id && pending.action === action
            return (
              <li
                key={row.id}
                className={`rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5 ${
                  row.activa ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[14px] font-bold text-[var(--text-primary)]">
                      <MapPin size={15} className="shrink-0 text-[var(--accent-primary)]" aria-hidden />
                      {row.direccion}
                    </p>
                    {row.nota ? (
                      <p className="mt-1 pl-6 text-[12px] text-[var(--text-muted)]">{row.nota}</p>
                    ) : null}
                    <p className="mt-1 pl-6 text-[12px] font-bold text-[var(--accent-deep)]">{row.ciudad}</p>
                    {row.telefono ? (
                      <p className="mt-1.5 flex items-center gap-1.5 pl-6 text-[12px] font-semibold text-[var(--text-secondary)]">
                        <Phone size={12} aria-hidden /> {formatTelefonoDisplay(row.telefono)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.activa}
                    aria-label={row.activa ? 'Visible en la tienda. Ocultar' : 'Oculta. Mostrar en la tienda'}
                    aria-busy={isPending('toggle') || undefined}
                    disabled={busy}
                    onClick={() => void toggle(row)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                      row.activa ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
                        row.activa ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    >
                      {isPending('toggle') ? (
                        <Loader2 size={11} className="animate-spin text-[var(--accent-deep)]" aria-hidden />
                      ) : null}
                    </span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                  <span className="text-[11px] font-bold text-[var(--text-muted)]">
                    {row.activa ? 'Visible en la tienda' : 'Oculta'}
                  </span>
                  <div className="flex items-center gap-1">
                    {(['up', 'down'] as const).map(action => {
                      const disabledEdge = action === 'up' ? index === 0 : index === rows.length - 1
                      return (
                        <button
                          key={action}
                          type="button"
                          aria-label={action === 'up' ? 'Subir en el orden' : 'Bajar en el orden'}
                          disabled={busy || disabledEdge}
                          onClick={() => void move(index, action === 'up' ? -1 : 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {isPending(action) ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden />
                          ) : action === 'up' ? (
                            <ArrowUp size={14} aria-hidden />
                          ) : (
                            <ArrowDown size={14} aria-hidden />
                          )}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      aria-label={`Editar ${row.direccion}`}
                      disabled={busy}
                      onClick={() => openEdit(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-30"
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${row.direccion}`}
                      disabled={busy}
                      onClick={() => setToDelete(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] disabled:opacity-30"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => (saving ? undefined : setEditing(null))}
        title={editing === 'new' ? 'Nueva sucursal' : 'Editar sucursal'}
      >
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            void save()
          }}
        >
          <Input label="Ciudad *" placeholder="Armenia, Quindío" maxLength={80} {...field('ciudad')} />
          <Input label="Dirección *" placeholder="Calle 16 No 13-47 local 3" maxLength={120} {...field('direccion')} />
          <Input
            label="Referencia (opcional)"
            placeholder="Ej. frente al parque principal"
            maxLength={120}
            {...field('nota')}
          />
          <Input
            label="Teléfono (opcional)"
            placeholder="3101234567"
            inputMode="tel"
            hint="Solo números, sin +57"
            {...field('telefono')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => (deleting ? undefined : setToDelete(null))}
        title="Eliminar sucursal"
        size="sm"
      >
        <p className="text-[14px] text-[var(--text-secondary)]">
          ¿Eliminar <strong className="text-[var(--text-primary)]">{toDelete?.direccion}</strong>? Dejará de
          aparecer en la tienda. Si solo quieres ocultarla un tiempo, usa el interruptor.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
