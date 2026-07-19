'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Categoria } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import CategoriaForm from '@/components/admin/CategoriaForm'
import {
  AdminListToolbar,
  AdminTablePagination,
} from '@/components/admin/AdminTable'
import CategoriaGrupoCard, {
  CategoriaGrupoCardSkeleton,
} from '@/components/admin/CategoriaGrupoCard'
import AdminLoadError from '@/components/admin/AdminLoadError'
import {
  ADMIN_TABLE_PAGE_SIZE,
  clampPage,
  paginateItems,
} from '@/lib/pagination'
import toast from 'react-hot-toast'
import { Plus, Tag } from 'lucide-react'
import MobileAdminToolbar from '@/components/admin/mobile/MobileAdminToolbar'
import { MobileEmptyState } from '@/components/admin/mobile/MobileAdminPrimitives'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selected, setSelected] = useState<Categoria | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [page, setPage] = useState(1)

  type GrupoCategoria = { root: Categoria; subs: Categoria[] }

  const fetchCategorias = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categorias')
      .select('*, subcategorias:categorias!padre_id(*)')
      .is('padre_id', null)
      .order('orden', { ascending: true })

    if (error) {
      toast.error('Error al cargar categorías')
      setLoadError(true)
    } else {
      setCategorias(data || [])
      setLoadError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const gruposFiltrados = useMemo<GrupoCategoria[]>(() => {
    const term = search.trim().toLowerCase()
    const estadoOk = (c: Categoria) =>
      filtroEstado === 'todas' ||
      (filtroEstado === 'activas' && c.activa) ||
      (filtroEstado === 'inactivas' && !c.activa)
    const textOk = (c: Categoria) =>
      !term ||
      c.nombre.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term)

    const grupos: GrupoCategoria[] = []
    for (const root of categorias) {
      const subs = [...(root.subcategorias || [])].sort((a, b) => a.orden - b.orden)
      const rootCoincide = estadoOk(root) && textOk(root)
      const subsCoinciden = subs.filter(s => estadoOk(s) && textOk(s))
      if (rootCoincide) {
        grupos.push({ root, subs: subs.filter(estadoOk) })
      } else if (subsCoinciden.length > 0) {
        grupos.push({ root, subs: subsCoinciden })
      }
    }
    return grupos
  }, [categorias, search, filtroEstado])

  const totalCategorias = useMemo(
    () => gruposFiltrados.reduce((n, g) => n + 1 + g.subs.length, 0),
    [gruposFiltrados],
  )

  const conteos = useMemo(
    () => ({
      principales: gruposFiltrados.length,
      subs: gruposFiltrados.reduce((n, g) => n + g.subs.length, 0),
    }),
    [gruposFiltrados],
  )

  useEffect(() => {
    setPage(1)
  }, [search, filtroEstado])

  const currentPage = clampPage(page, gruposFiltrados.length, ADMIN_TABLE_PAGE_SIZE)

  const gruposPaginados = useMemo(
    () => paginateItems(gruposFiltrados, currentPage, ADMIN_TABLE_PAGE_SIZE),
    [gruposFiltrados, currentPage],
  )

  const abrirCrear = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const abrirEditar = (cat: Categoria) => {
    setSelected(cat)
    setModalOpen(true)
  }

  const handleEliminar = async () => {
    if (!selected) return
    setDeleting(true)

    const { error } = await supabase.from('categorias').delete().eq('id', selected.id)

    if (error) toast.error('Error al eliminar')
    else {
      toast.success('Categoría eliminada')
      setDeleteModal(false)
      fetchCategorias()
    }
    setDeleting(false)
  }

  const toggleActiva = async (cat: Categoria) => {
    const { error } = await supabase
      .from('categorias')
      .update({ activa: !cat.activa })
      .eq('id', cat.id)

    if (error) toast.error('Error al actualizar')
    else {
      toast.success(cat.activa ? 'Categoría desactivada' : 'Categoría activada')
      fetchCategorias()
    }
  }

  const filtroLabels: Record<typeof filtroEstado, string> = {
    todas: 'Todas',
    activas: 'Activas',
    inactivas: 'Inactivas',
  }

  return (
    <>
    <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 border-b border-[rgba(232,136,181,0.16)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--accent-secondary)]" />
            <p className="text-[12px] font-bold text-[var(--accent-deep)]">
              Gestión
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-4xl">
            Categorías
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[var(--text-secondary)]">
            Organiza el catálogo por secciones y subcategorías
          </p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="self-start sm:self-auto">
          <Plus size={13} />
          Nueva categoría
        </Button>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o slug..."
        filters={[
          { id: 'todas' as const, label: 'Todas' },
          { id: 'activas' as const, label: 'Activas' },
          { id: 'inactivas' as const, label: 'Inactivas' },
        ]}
        activeFilter={filtroEstado}
        onFilterChange={setFiltroEstado}
      />

      <div className="mb-4 flex items-center justify-between border-b border-[rgba(232,136,181,0.12)] pb-3">
        <p className="text-[12px] uppercase tracking-[1px] text-[var(--text-muted)]">
          {conteos.principales} categoría{conteos.principales !== 1 ? 's' : ''}
          {conteos.subs > 0 && (
            <>
              {' · '}
              {conteos.subs} subcategoría{conteos.subs !== 1 ? 's' : ''}
            </>
          )}
          {search ? ` para "${search}"` : ''}
        </p>
        {filtroEstado !== 'todas' && (
          <span className="text-[11px] text-[var(--accent-secondary)]">
            Filtro: {filtroLabels[filtroEstado]}
          </span>
        )}
      </div>

      {/* Tarjetas agrupadas por familia */}
      {loading ? (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CategoriaGrupoCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <AdminLoadError
          onRetry={fetchCategorias}
          title="No se pudieron cargar las categorías"
        />
      ) : gruposFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(232,136,181,0.25)] bg-[rgba(232,136,181,0.08)] text-[var(--accent-primary)]">
            <Tag size={22} />
          </span>
          <p className="text-[14px] font-light text-[var(--text-primary)]">
            {search
              ? 'No se encontraron categorías con esa búsqueda'
              : filtroEstado !== 'todas'
                ? `No hay categorías ${filtroLabels[filtroEstado].toLowerCase()}`
                : 'Aún no hay categorías creadas'}
          </p>
          <p className="mt-1.5 max-w-sm text-[12px] font-light text-[var(--text-muted)]">
            {search || filtroEstado !== 'todas'
              ? 'Prueba con otros filtros o términos de búsqueda'
              : 'Crea la primera categoría para organizar tus productos'}
          </p>
          {!search && filtroEstado === 'todas' && (
            <Button onClick={abrirCrear} size="sm" className="mt-6">
              <Plus size={13} />
              Crear categoría
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {gruposPaginados.map((grupo, i) => (
            <CategoriaGrupoCard
              key={grupo.root.id}
              grupo={grupo}
              index={i}
              onEdit={abrirEditar}
              onDelete={cat => {
                setSelected(cat)
                setDeleteModal(true)
              }}
              onToggleActiva={toggleActiva}
            />
          ))}
        </div>
      )}

      {!loading && gruposFiltrados.length > 0 && (
        <AdminTablePagination
          page={currentPage}
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalItems={gruposFiltrados.length}
          onPageChange={setPage}
        />
      )}
    </div>

    <div className="mobile-admin-page px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:hidden">
      <p className="mb-4 text-[12px] font-light text-[var(--text-muted)]">
        Organiza el catálogo por secciones y subcategorías
      </p>

      <MobileAdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o slug..."
        filters={[
          { id: 'todas' as const, label: 'Todas' },
          { id: 'activas' as const, label: 'Activas' },
          { id: 'inactivas' as const, label: 'Inactivas' },
        ]}
        activeFilter={filtroEstado}
        onFilterChange={setFiltroEstado}
      />

      <p className="mb-3 text-[11px] text-[var(--text-subtle)]">
        {conteos.principales} categoría{conteos.principales !== 1 ? 's' : ''}
        {conteos.subs > 0
          ? ` · ${conteos.subs} subcategoría${conteos.subs !== 1 ? 's' : ''}`
          : ''}
        {search ? ` · "${search}"` : ''}
        {filtroEstado !== 'todas' ? ` · ${filtroLabels[filtroEstado]}` : ''}
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CategoriaGrupoCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <AdminLoadError
          onRetry={fetchCategorias}
          title="No se pudieron cargar las categorías"
        />
      ) : gruposFiltrados.length === 0 ? (
        <MobileEmptyState
          icon={Tag}
          title={
            search
              ? 'No se encontraron categorías'
              : filtroEstado !== 'todas'
                ? `No hay categorías ${filtroLabels[filtroEstado].toLowerCase()}`
                : 'Aún no hay categorías'
          }
          description={
            search || filtroEstado !== 'todas'
              ? 'Prueba con otros filtros'
              : 'Crea la primera categoría'
          }
          action={
            !search && filtroEstado === 'todas' ? (
              <Button onClick={abrirCrear} size="sm">
                <Plus size={13} />
                Crear categoría
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {gruposPaginados.map((grupo, i) => (
            <CategoriaGrupoCard
              key={grupo.root.id}
              grupo={grupo}
              index={i}
              onEdit={abrirEditar}
              onDelete={cat => {
                setSelected(cat)
                setDeleteModal(true)
              }}
              onToggleActiva={toggleActiva}
            />
          ))}
        </div>
      )}

      <AdminTablePagination
        page={currentPage}
        pageSize={ADMIN_TABLE_PAGE_SIZE}
        totalItems={gruposFiltrados.length}
        onPageChange={setPage}
        compact
      />

      <button
        type="button"
        onClick={abrirCrear}
        className="mobile-admin-fab fixed z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(232,136,181,0.45)] bg-[var(--accent-secondary)] text-[var(--bg-base)] shadow-lg md:hidden"
        aria-label="Nueva categoría"
      >
        <Plus size={22} strokeWidth={1.75} />
      </button>
    </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar categoría' : 'Nueva categoría'}
        size="xl"
      >
        <CategoriaForm
          key={selected?.id ?? 'nueva'}
          categoria={selected}
          categoriasRaiz={categorias}
          ordenDefault={totalCategorias}
          onSuccess={() => {
            setModalOpen(false)
            fetchCategorias()
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Eliminar categoría" size="sm">
        <div className="space-y-5">
          <p className="text-[13px] font-light leading-relaxed text-[var(--text-secondary)]">
            ¿Estás seguro de eliminar{' '}
            <span className="text-[var(--accent-secondary)]">{selected?.nombre}</span>? Los productos de esta
            categoría quedarán sin categoría.
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
