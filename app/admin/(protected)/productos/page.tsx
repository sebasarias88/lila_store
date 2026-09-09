'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Producto } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ProductForm from '@/components/admin/ProductForm'
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderRow,
  AdminTableTh,
  AdminTableBody,
  AdminTableRow,
  AdminTableTd,
  AdminTableEmpty,
  AdminTableImage,
  AdminTablePrimary,
  AdminTableCategory,
  AdminTableCategoryEmpty,
  AdminTablePrice,
  AdminTableStatus,
  AdminTableActions,
  AdminTableSkeletonRow,
  AdminListToolbar,
  AdminListMeta,
  AdminTablePagination,
} from '@/components/admin/AdminTable'
import {
  ADMIN_TABLE_PAGE_SIZE,
  clampPage,
  paginateItems,
} from '@/lib/pagination'
import toast from 'react-hot-toast'
import {
  Plus,
  Star,
  Package,
} from 'lucide-react'
import MobileAdminToolbar from '@/components/admin/mobile/MobileAdminToolbar'
import MobileProductCard from '@/components/admin/mobile/MobileProductCard'
import { MobileEmptyState } from '@/components/admin/mobile/MobileAdminPrimitives'
import AdminLoadError from '@/components/admin/AdminLoadError'
import { stockBadgeTone } from '@/lib/stock'

type CategoriaInfo = { nombre: string; padre_id: string | null }

function StockChip({ label, stock }: { label: string; stock: number }) {
  const tone = stockBadgeTone(stock)
  const toneClass =
    tone === 'ok'
      ? 'bg-[rgba(52,211,153,0.12)] text-emerald-400'
      : tone === 'low'
        ? 'bg-[rgba(251,191,36,0.14)] text-amber-400'
        : 'bg-[rgba(248,113,113,0.12)] text-red-400'
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass}`}
    >
      {label}: {stock}
    </span>
  )
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categoriasMap, setCategoriasMap] = useState<Record<string, CategoriaInfo>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [formModal, setFormModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroDisponible, setFiltroDisponible] = useState<'todos' | 'disponible' | 'agotado'>('todos')
  const [page, setPage] = useState(1)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('productos')
      .select('*, categoria:categorias(id, nombre, slug)')
      .order('orden', { ascending: true })

    if (filtroDisponible === 'disponible') query = query.eq('disponible', true)
    if (filtroDisponible === 'agotado') query = query.eq('disponible', false)

    const [{ data, error }, { data: cats }] = await Promise.all([
      query,
      supabase.from('categorias').select('id, nombre, padre_id'),
    ])

    if (error) {
      toast.error('Error al cargar productos')
      setLoadError(true)
    } else {
      setProductos(data || [])
      const map: Record<string, CategoriaInfo> = {}
      ;(cats || []).forEach((c: { id: string; nombre: string; padre_id: string | null }) => {
        map[c.id] = { nombre: c.nombre, padre_id: c.padre_id ?? null }
      })
      setCategoriasMap(map)
      setLoadError(false)
    }
    setLoading(false)
  }, [filtroDisponible])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const productosFiltrados = productos.filter(p => {
    const q = search.trim()
    if (!q) return true
    const fold = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
    const needle = fold(q)
    return (
      fold(p.nombre).includes(needle) ||
      (p.sku ? fold(p.sku).includes(needle) : false)
    )
  })

  useEffect(() => {
    setPage(1)
  }, [search, filtroDisponible])

  const currentPage = clampPage(page, productosFiltrados.length, ADMIN_TABLE_PAGE_SIZE)

  const productosPaginados = useMemo(
    () => paginateItems(productosFiltrados, currentPage, ADMIN_TABLE_PAGE_SIZE),
    [productosFiltrados, currentPage],
  )

  const abrirCrear = () => {
    setSelected(null)
    setFormModal(true)
  }
  const abrirEditar = (p: Producto) => {
    setSelected(p)
    setFormModal(true)
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)
    const productoId = selected.id

    try {
      // Quitar relaciones primero (FKs bloquean el DELETE del producto).
      const { data: tipos, error: tiposErr } = await supabase
        .from('variacion_tipos')
        .select('id')
        .eq('producto_id', productoId)
      if (tiposErr) throw tiposErr

      const tipoIds = ((tipos || []) as { id: string }[]).map(t => t.id)
      if (tipoIds.length > 0) {
        const { error } = await supabase
          .from('variacion_opciones')
          .delete()
          .in('tipo_id', tipoIds)
        if (error) throw error
      }

      const relatedDeletes = await Promise.all([
        supabase.from('variacion_tipos').delete().eq('producto_id', productoId),
        supabase.from('producto_secciones').delete().eq('producto_id', productoId),
        supabase.from('producto_categorias').delete().eq('producto_id', productoId),
      ])
      const relatedError = relatedDeletes.find(r => r.error)?.error
      if (relatedError) throw relatedError

      // Si el anuncio apunta a este producto, soltar la referencia (no bloquear si falla).
      await supabase
        .from('anuncio_modal')
        .update({ producto_id: null })
        .eq('producto_id', productoId)

      if (selected.imagenes?.length) {
        const paths = selected.imagenes
          .map(url => {
            const parts = url.split('/productos/')
            return parts.length > 1 ? `productos/${parts[1]}` : null
          })
          .filter(Boolean) as string[]
        if (paths.length) await supabase.storage.from('productos').remove(paths)
      }

      const { error } = await supabase.from('productos').delete().eq('id', productoId)
      if (error) throw error

      toast.success('Producto eliminado')
      setDeleteModal(false)
      fetchProductos()
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Error al eliminar'
      console.error('[admin] Eliminar producto:', err)
      toast.error(
        message.includes('foreign key') || message.includes('violates')
          ? 'No se pudo eliminar: hay datos relacionados. Intenta de nuevo.'
          : 'Error al eliminar el producto',
      )
    } finally {
      setDeleting(false)
    }
  }

  const toggleDisponible = async (p: Producto) => {
    const { error } = await supabase
      .from('productos')
      .update({ disponible: !p.disponible })
      .eq('id', p.id)

    if (error) toast.error('Error al actualizar')
    else {
      toast.success(p.disponible ? 'Marcado como agotado' : 'Marcado como disponible')
      fetchProductos()
    }
  }

  const toggleCatalogo = async (
    p: Producto,
    campo: 'disponible_detal' | 'disponible_mayoreo',
  ) => {
    const nuevoValor = !p[campo]
    const detal = campo === 'disponible_detal' ? nuevoValor : p.disponible_detal
    const mayoreo = campo === 'disponible_mayoreo' ? nuevoValor : p.disponible_mayoreo

    const { error } = await supabase
      .from('productos')
      .update({
        [campo]: nuevoValor,
        disponible: detal || mayoreo,
      })
      .eq('id', p.id)

    if (error) toast.error('Error al actualizar')
    else {
      const etiqueta = campo === 'disponible_detal' ? 'Detal' : 'Mayorista'
      toast.success(`${etiqueta} ${nuevoValor ? 'activado' : 'desactivado'}`)
      fetchProductos()
    }
  }

  const formatPrecio = (precio: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio)

  /** Nombre de la categoría padre si la categoría del producto es una subcategoría. */
  const getCategoriaPadre = (categoriaId?: string | null): string | null => {
    if (!categoriaId) return null
    const padreId = categoriasMap[categoriaId]?.padre_id
    if (!padreId) return null
    return categoriasMap[padreId]?.nombre ?? null
  }

  const filtroLabels: Record<typeof filtroDisponible, string> = {
    todos: 'Todos',
    disponible: 'Disponibles',
    agotado: 'Agotados',
  }

  return (
    <>
    <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 border-b border-[rgba(169,137,224,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Gestión
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Productos
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            Administra el catálogo de la tienda
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="self-start sm:self-auto">
          <Plus size={13} />
          Nuevo producto
        </Button>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
        filters={[
          { id: 'todos' as const, label: 'Todos' },
          { id: 'disponible' as const, label: 'Disponibles' },
          { id: 'agotado' as const, label: 'Agotados' },
        ]}
        activeFilter={filtroDisponible}
        onFilterChange={setFiltroDisponible}
      />

      <AdminListMeta
        count={productosFiltrados.length}
        noun="producto"
        search={search || undefined}
        activeFilterLabel={filtroDisponible !== 'todos' ? filtroLabels[filtroDisponible] : undefined}
      />

      {/* Tabla */}
      {loadError && !loading ? (
        <AdminLoadError
          onRetry={fetchProductos}
          title="No se pudieron cargar los productos"
        />
      ) : (
      <AdminTable
        minWidth="1280px"
        footer={
          <AdminTablePagination
            page={currentPage}
            pageSize={ADMIN_TABLE_PAGE_SIZE}
            totalItems={productosFiltrados.length}
            onPageChange={setPage}
          />
        }
      >
        <AdminTableHead>
          <AdminTableHeaderRow>
            <AdminTableTh className="min-w-[6.5rem]">Imagen</AdminTableTh>
            <AdminTableTh className="min-w-[14rem]">Producto</AdminTableTh>
            <AdminTableTh className="min-w-[12rem]">Categoría</AdminTableTh>
            <AdminTableTh className="min-w-[8.5rem]">Stock</AdminTableTh>
            <AdminTableTh className="min-w-[8rem]">Precio detal</AdminTableTh>
            <AdminTableTh className="min-w-[9rem]">Precio mayorista</AdminTableTh>
            <AdminTableTh className="min-w-[8rem]">Estado</AdminTableTh>
            <AdminTableTh className="min-w-[7.5rem]">Destacado</AdminTableTh>
            <AdminTableTh className="min-w-[5.5rem] text-center">Acciones</AdminTableTh>
          </AdminTableHeaderRow>
        </AdminTableHead>
        <AdminTableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <AdminTableSkeletonRow key={i} cols={9} />)
          ) : productosFiltrados.length === 0 ? (
            <AdminTableEmpty
              colSpan={9}
              icon={Package}
              title={
                search
                  ? 'No se encontraron productos con esa búsqueda'
                  : filtroDisponible !== 'todos'
                    ? `No hay productos ${filtroLabels[filtroDisponible].toLowerCase()}`
                    : 'Aún no hay productos en el catálogo'
              }
              description={
                search || filtroDisponible !== 'todos'
                  ? 'Prueba con otros filtros o términos de búsqueda'
                  : 'Crea el primer producto para empezar a vender'
              }
              action={
                !search && filtroDisponible === 'todos' ? (
                  <Button onClick={abrirCrear} size="sm" className="">
                    <Plus size={13} />
                    Crear producto
                  </Button>
                ) : undefined
              }
            />
          ) : (
            productosPaginados.map((p, i) => (
              <AdminTableRow key={p.id} index={i}>
                <AdminTableTd>
                  <AdminTableImage src={p.imagenes?.[0]} alt={p.nombre} />
                </AdminTableTd>

                <AdminTableTd>
                  <AdminTablePrimary
                    title={p.nombre}
                    subtitle={p.sku ? `SKU · ${p.sku}` : undefined}
                  />
                </AdminTableTd>

                <AdminTableTd>
                  {p.categoria ? (
                    <AdminTableCategory
                      name={p.categoria.nombre}
                      parent={getCategoriaPadre(p.categoria.id)}
                    />
                  ) : (
                    <AdminTableCategoryEmpty />
                  )}
                </AdminTableTd>

                <AdminTableTd>
                  <div className="flex flex-col items-start gap-1">
                    <StockChip label="Detal" stock={Math.max(0, Math.floor(p.stock_detal ?? 0))} />
                    <StockChip
                      label="Mayoreo"
                      stock={Math.max(0, Math.floor(p.stock_mayoreo ?? 0))}
                    />
                  </div>
                </AdminTableTd>

                <AdminTableTd>
                  <AdminTablePrice
                    value={formatPrecio(p.precio)}
                    previous={p.precio_antes ? formatPrecio(p.precio_antes) : null}
                    tone="detal"
                  />
                </AdminTableTd>

                <AdminTableTd>
                  {p.precio_mayoreo != null ? (
                    <AdminTablePrice
                      value={formatPrecio(p.precio_mayoreo)}
                      previous={
                        p.precio_antes_mayoreo ? formatPrecio(p.precio_antes_mayoreo) : null
                      }
                      tone="mayoreo"
                    />
                  ) : (
                    <AdminTablePrice value="—" tone="muted" />
                  )}
                </AdminTableTd>

                <AdminTableTd>
                  <div className="flex flex-col gap-1.5">
                    <CatalogToggle
                      label="Detal"
                      active={p.disponible_detal}
                      tone="detal"
                      onClick={() => toggleCatalogo(p, 'disponible_detal')}
                    />
                    <CatalogToggle
                      label="Mayorista"
                      active={p.disponible_mayoreo}
                      tone="mayoreo"
                      onClick={() => toggleCatalogo(p, 'disponible_mayoreo')}
                    />
                  </div>
                </AdminTableTd>

                <AdminTableTd>
                  {p.destacado ? (
                    <AdminTableStatus
                      label="Destacado"
                      icon={Star}
                      variant="gold"
                      iconClassName="fill-[var(--accent-secondary)]"
                    />
                  ) : (
                    <span className="text-[11px] font-light text-[var(--text-faint)]">—</span>
                  )}
                </AdminTableTd>

                <AdminTableTd className="text-center">
                  <AdminTableActions
                    onEdit={() => abrirEditar(p)}
                    onDelete={() => {
                      setSelected(p)
                      setDeleteModal(true)
                    }}
                  />
                </AdminTableTd>
              </AdminTableRow>
            ))
          )}
        </AdminTableBody>
      </AdminTable>
      )}
    </div>

    <div className="mobile-admin-page px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:hidden">
      <p className="mb-4 text-[12px] font-light text-[var(--text-muted)]">
        Administra el catálogo de la tienda
      </p>

      <MobileAdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
        filters={[
          { id: 'todos' as const, label: 'Todos' },
          { id: 'disponible' as const, label: 'Disponibles' },
          { id: 'agotado' as const, label: 'Agotados' },
        ]}
        activeFilter={filtroDisponible}
        onFilterChange={setFiltroDisponible}
      />

      <p className="mb-3 text-[11px] text-[var(--text-subtle)]">
        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
        {search ? ` · "${search}"` : ''}
        {filtroDisponible !== 'todos' ? ` · ${filtroLabels[filtroDisponible]}` : ''}
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : loadError ? (
        <AdminLoadError
          onRetry={fetchProductos}
          title="No se pudieron cargar los productos"
        />
      ) : productosFiltrados.length === 0 ? (
        <MobileEmptyState
          icon={Package}
          title={
            search
              ? 'No se encontraron productos'
              : filtroDisponible !== 'todos'
                ? `No hay productos ${filtroLabels[filtroDisponible].toLowerCase()}`
                : 'Aún no hay productos'
          }
          description={
            search || filtroDisponible !== 'todos'
              ? 'Prueba con otros filtros'
              : 'Crea el primer producto para empezar'
          }
          action={
            !search && filtroDisponible === 'todos' ? (
              <Button onClick={abrirCrear} size="sm">
                <Plus size={13} />
                Crear producto
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {productosPaginados.map(p => (
            <MobileProductCard
              key={p.id}
              producto={p}
              formatPrecio={formatPrecio}
              parentCategoria={getCategoriaPadre(p.categoria?.id)}
              onEdit={() => abrirEditar(p)}
              onDelete={() => {
                setSelected(p)
                setDeleteModal(true)
              }}
              onToggleDisponible={() => toggleDisponible(p)}
            />
          ))}
        </div>
      )}

      <AdminTablePagination
        page={currentPage}
        pageSize={ADMIN_TABLE_PAGE_SIZE}
        totalItems={productosFiltrados.length}
        onPageChange={setPage}
        compact
      />

      <button
        type="button"
        onClick={abrirCrear}
        className="mobile-admin-fab fixed z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(169,137,224,0.45)] bg-[var(--accent-secondary)] text-[var(--bg-base)] shadow-lg md:hidden"
        aria-label="Nuevo producto"
      >
        <Plus size={22} strokeWidth={1.75} />
      </button>
    </div>

      <Modal
        open={formModal}
        onClose={() => setFormModal(false)}
        title={selected ? 'Editar producto' : 'Nuevo producto'}
        size="xl"
      >
        <ProductForm
          producto={selected}
          onSuccess={() => {
            setFormModal(false)
            fetchProductos()
          }}
          onCancel={() => setFormModal(false)}
        />
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Eliminar producto" size="sm">
        <div className="space-y-5">
          <p className="text-[13px] font-light leading-relaxed text-[var(--text-secondary)]">
            ¿Estás seguro de eliminar{' '}
            <span className="text-[var(--accent-secondary)]">{selected?.nombre}</span>? También se eliminarán todas
            sus imágenes. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)} fullWidth>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleEliminar} loading={deleting} fullWidth>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

type CatalogToggleTone = 'detal' | 'mayoreo'

const CATALOG_TOGGLE_STYLES: Record<CatalogToggleTone, string> = {
  detal:
    'border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.1)] text-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.06),inset_0_1px_0_rgba(52,211,153,0.12)]',
  mayoreo:
    'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.1)] text-blue-400 shadow-[0_0_0_1px_rgba(96,165,250,0.06),inset_0_1px_0_rgba(96,165,250,0.12)]',
}

function CatalogToggle({
  label,
  active,
  tone,
  onClick,
}: {
  label: string
  active: boolean
  tone: CatalogToggleTone
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? `Visible en ${label.toLowerCase()} — click para ocultar` : `Oculto en ${label.toLowerCase()} — click para mostrar`}
      aria-pressed={active}
      className={`inline-flex w-[5rem] items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-light uppercase tracking-[1.2px] transition-all duration-200 ${
        active
          ? CATALOG_TOGGLE_STYLES[tone]
          : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-faint)] hover:border-[rgba(248,246,241,0.18)] hover:text-[var(--text-muted)]'
      }`}
    >
      {label}
    </button>
  )
}
