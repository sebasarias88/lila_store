'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Producto, Categoria, VideoTipo } from '@/types'
import { Input, Textarea } from '@/components/ui/Input'
import { AdminMultiSelect } from '@/components/ui/AdminSelect'
import { CopInput } from '@/components/ui/CopInput'
import { formatCopInput, parseCopInput } from '@/lib/currency'
import Button from '@/components/ui/Button'
import ImageUploader from '@/components/admin/ImageUploader'
import AdminVideoPreview from '@/components/admin/AdminVideoPreview'
import VariacionesEditor from '@/components/admin/VariacionesEditor'
import SeccionesEditor from '@/components/admin/SeccionesEditor'
import AdminFormLayout from '@/components/admin/mobile/AdminFormLayout'
import toast from 'react-hot-toast'

type ProductFormProps = {
  producto?: Producto | null
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

export default function ProductForm({ producto, onSuccess, onCancel }: ProductFormProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    precio: '',
    precio_antes: '',
    precio_mayoreo: '',
    precio_antes_mayoreo: '',
    stock: 0,
    disponible_detal: true,
    disponible_mayoreo: true,
    destacado: false,
    imagenes: [] as string[],
    video_url: '',
    video_tipo: '' as '' | VideoTipo,
    sku: '',
    marca: '',
    orden: 0,
  })
  const [categorias_ids, setCategorias_ids] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('orden')
      .then(({ data }: { data: Categoria[] | null }) => setCategorias(data || []))

    if (producto) {
      setForm({
        nombre: producto.nombre,
        slug: producto.slug,
        descripcion: producto.descripcion || '',
        precio: formatCopInput(producto.precio),
        precio_antes: producto.precio_antes != null ? formatCopInput(producto.precio_antes) : '',
        precio_mayoreo: producto.precio_mayoreo != null ? formatCopInput(producto.precio_mayoreo) : '',
        precio_antes_mayoreo:
          producto.precio_antes_mayoreo != null ? formatCopInput(producto.precio_antes_mayoreo) : '',
        stock: Math.max(0, Math.floor(producto.stock ?? 0)),
        disponible_detal: producto.disponible_detal ?? producto.disponible,
        disponible_mayoreo: producto.disponible_mayoreo ?? producto.disponible,
        destacado: producto.destacado,
        imagenes: producto.imagenes || [],
        video_url: producto.video_url || '',
        video_tipo: (producto.video_tipo as VideoTipo | null) || '',
        sku: producto.sku || '',
        marca: producto.marca || '',
        orden: producto.orden,
      })

      supabase
        .from('producto_categorias')
        .select('categoria_id')
        .eq('producto_id', producto.id)
        .then(({ data }: { data: { categoria_id: string }[] | null }) => {
          const ids = (data || []).map(row => row.categoria_id)
          if (ids.length > 0) {
            setCategorias_ids(ids)
          } else if (producto.categoria_id) {
            setCategorias_ids([producto.categoria_id])
          }
        })
    }
  }, [producto])

  const categoriaGrupos = useMemo(() => {
    const nombrePadre = (id: string | null) =>
      categorias.find(c => c.id === id)?.nombre
    const raices = categorias.filter(c => !c.padre_id)
    const subs = categorias.filter(c => c.padre_id)
    return [
      {
        label: 'Categorías',
        options: raices.map(c => ({ value: c.id, label: c.nombre })),
      },
      {
        label: 'Subcategorías',
        options: subs.map(c => ({
          value: c.id,
          label: c.nombre,
          hint: nombrePadre(c.padre_id),
        })),
      },
    ]
  }, [categorias])

  const generarSlug = (nombre: string) =>
    nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const handleNombre = (nombre: string) => {
    setForm(f => ({
      ...f,
      nombre,
      slug: producto ? f.slug : generarSlug(nombre),
    }))
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    const precio = parseCopInput(form.precio)
    if (precio === null) {
      toast.error('El precio es requerido')
      return
    }

    const videoUrl = form.video_url.trim()
    if (videoUrl) {
      try {
        const parsed = new URL(videoUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          toast.error('El link de video debe ser una URL válida (http/https)')
          return
        }
      } catch {
        toast.error('El link de video no es una URL válida')
        return
      }
      if (!form.video_tipo) {
        toast.error('Elige la plataforma del video')
        return
      }
    }

    setSaving(true)
    const mainCatId = categorias_ids[0] || null
    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      descripcion: form.descripcion.trim() || null,
      precio,
      precio_antes: parseCopInput(form.precio_antes),
      precio_mayoreo: parseCopInput(form.precio_mayoreo),
      precio_antes_mayoreo: parseCopInput(form.precio_antes_mayoreo),
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      disponible_detal: form.disponible_detal,
      disponible_mayoreo: form.disponible_mayoreo,
      disponible: form.disponible_detal || form.disponible_mayoreo,
      destacado: form.destacado,
      categoria_id: mainCatId,
      imagenes: form.imagenes,
      video_url: videoUrl || null,
      video_tipo: videoUrl && form.video_tipo ? form.video_tipo : null,
      sku: form.sku.trim() || null,
      marca: form.marca.trim() || null,
      orden: form.orden,
    }

    let savedProductId = producto?.id ?? null

    if (producto) {
      const { error } = await supabase.from('productos').update(payload).eq('id', producto.id)

      if (error) {
        if (error.code === '23505') toast.error('Ya existe un producto con ese slug')
        else toast.error('Error al actualizar producto')
        setSaving(false)
        return
      }
      savedProductId = producto.id
      toast.success('Producto actualizado')
    } else {
      const { data, error } = await supabase
        .from('productos')
        .insert([payload])
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') toast.error('Ya existe un producto con ese slug')
        else toast.error('Error al crear producto')
        setSaving(false)
        return
      }
      savedProductId = data?.id ?? null
      toast.success('Producto creado')
    }

    if (savedProductId) {
      await supabase
        .from('producto_categorias')
        .delete()
        .eq('producto_id', savedProductId)

      if (categorias_ids.length > 0) {
        await supabase.from('producto_categorias').insert(
          categorias_ids.map(cat_id => ({
            producto_id: savedProductId,
            categoria_id: cat_id,
          })),
        )
      }
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
            {producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      }
    >
      <FormSection title="Imágenes">
        <ImageUploader
          imagenes={form.imagenes}
          onChange={imgs => setForm(f => ({ ...f, imagenes: imgs }))}
        />
      </FormSection>

      <FormSection title="Video (opcional)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <label className="admin-form-label" htmlFor="producto-video-tipo">
              Plataforma
            </label>
            <select
              id="producto-video-tipo"
              value={form.video_tipo}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  video_tipo: e.target.value as '' | VideoTipo,
                }))
              }
              className="admin-input w-full rounded-xl border px-4 py-3 text-[13px] md:rounded-[2px]"
            >
              <option value="">Sin video</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <Input
            label="Link de video (opcional)"
            type="url"
            inputMode="url"
            value={form.video_url}
            onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
            placeholder="https://..."
            hint="Pega el link del video o reel. Si lo dejas vacío, no se muestra video."
          />
        </div>
        <AdminVideoPreview
          url={form.video_url}
          tipo={form.video_tipo}
          posterUrl={form.imagenes[0] || null}
        />
      </FormSection>

      <FormSection title="Información">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={e => handleNombre(e.target.value)}
            placeholder="Ej: Shampoo Keratina Pro"
          />
          <Input
            label="Slug (URL)"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="shampoo-keratina-pro"
            hint="Generado automáticamente al escribir el nombre"
          />
        </div>
        <Input
          label="Marca"
          value={form.marca}
          onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
          placeholder="Ej: L'Oréal, Revlon, Maybelline, Genérico..."
          hint="Opcional — permite filtrar por marca en el catálogo"
        />
        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Descripción detallada del producto..."
          rows={3}
        />
      </FormSection>

      <FormSection title="Precios — Detal">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CopInput
            label="Precio (COP) *"
            value={form.precio}
            onChange={precio => setForm(f => ({ ...f, precio }))}
            placeholder="45.000"
          />
          <CopInput
            label="Precio anterior (tachado)"
            value={form.precio_antes}
            onChange={precio_antes => setForm(f => ({ ...f, precio_antes }))}
            placeholder="60.000"
            hint="Opcional — para mostrar descuento"
          />
        </div>
      </FormSection>

      <FormSection title="Precios — Mayorista">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CopInput
            label="Precio mayorista (COP)"
            value={form.precio_mayoreo}
            onChange={precio_mayoreo => setForm(f => ({ ...f, precio_mayoreo }))}
            placeholder="38.000"
            hint="Catálogo mayorista"
          />
          <CopInput
            label="Precio mayorista anterior"
            value={form.precio_antes_mayoreo}
            onChange={precio_antes_mayoreo => setForm(f => ({ ...f, precio_antes_mayoreo }))}
            placeholder="50.000"
            hint="Opcional — precio tachado en mayorista"
          />
        </div>
      </FormSection>

      <FormSection title="Clasificación">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="admin-form-label">Categorías *</label>
            <AdminMultiSelect
              values={categorias_ids}
              onChange={setCategorias_ids}
              groups={categoriaGrupos}
              placeholder="+ Agregar categoría"
              emptyLabel="No hay más categorías"
            />
            <p className="admin-form-hint">
              Puedes agregar el producto a múltiples categorías
            </p>
          </div>
          <Input
            label="SKU"
            value={form.sku}
            onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
            placeholder="Ej: SH-KER-001"
            hint="Código interno opcional"
          />
        </div>
        <Input
          label="Orden de aparición"
          type="number"
          value={form.orden}
          onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))}
          hint="Menor número = aparece primero en el catálogo"
        />
      </FormSection>

      <FormSection title="Visibilidad">
        <div className="admin-form-panel px-4 py-3.5">
          <Input
            label="Stock disponible"
            type="number"
            min={0}
            step={1}
            value={form.stock}
            onChange={e => {
              const raw = e.target.value
              if (raw === '') {
                setForm(f => ({ ...f, stock: 0 }))
                return
              }
              const n = Math.floor(Number(raw))
              setForm(f => ({
                ...f,
                stock: Number.isFinite(n) && n > 0 ? n : 0,
              }))
            }}
            hint="Unidades en inventario. Si es 0, el catálogo lo muestra como agotado aunque el toggle esté activo."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              key: 'disponible_detal' as const,
              label: 'Disponible en Detal',
              desc: 'Visible en el catálogo al detal',
            },
            {
              key: 'disponible_mayoreo' as const,
              label: 'Disponible en Mayorista',
              desc: 'Visible en el catálogo mayorista',
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="admin-form-panel flex items-center justify-between px-4 py-3.5"
            >
              <div className="pr-4">
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

        <div className="admin-form-panel mt-3 flex items-center justify-between px-4 py-3.5">
          <div className="pr-4">
            <p className="admin-form-panel__title">Producto destacado</p>
            <p className="admin-form-panel__desc">Aparece en la sección de inicio</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, destacado: !f.destacado }))}
            className={`admin-toggle ${form.destacado ? 'admin-toggle--on' : 'admin-toggle--off'}`}
            aria-pressed={form.destacado}
          >
            <span className="admin-toggle__thumb" />
          </button>
        </div>
      </FormSection>

      <FormSection title="Variaciones">
        <VariacionesEditor productoId={producto?.id ?? null} />
      </FormSection>

      <FormSection title="Secciones de información">
        <SeccionesEditor productoId={producto?.id ?? null} />
      </FormSection>
    </AdminFormLayout>
  )
}
