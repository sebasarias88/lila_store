'use client'

import { useState, useMemo, useEffect, useRef, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import { Producto, Categoria } from '@/types'
import ProductCard from '@/components/catalog/ProductCard'
import ProductCardMobile from '@/components/catalog/mobile/ProductCardMobile'
import { ProductGridMobile } from '@/components/catalog/mobile/ResponsiveProductCard'
import MobileCatalogToolbar from '@/components/catalog/mobile/MobileCatalogToolbar'
import MobileFiltersDrawer from '@/components/catalog/mobile/MobileFiltersDrawer'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { getPrecioOrden, type CatalogType } from '@/lib/catalog'
import { getPaginationChunk } from '@/lib/pagination'
import { Search, X, Package, ChevronLeft, ChevronRight, Tag, Loader2, Sparkles } from 'lucide-react'
import PageGoldAccent from '@/components/catalog/PageGoldAccent'
import CatalogCategoryMenu from '@/components/catalog/CatalogCategoryMenu'
import CatalogFilterSelect, {
  CatalogFilterOption,
} from '@/components/catalog/CatalogFilterSelect'
import { signalCatalogNavigating } from '@/components/catalog/NavigationProgress'

type Props = {
  productos: Producto[]
  categorias: Categoria[]
  initialQ: string
  initialCategoria: string
  initialMarca?: string
  catalogType?: CatalogType
}

type Orden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre'

const ITEMS_POR_PAGINA = 24

function productoCoincideCategoria(
  producto: Producto,
  categoriaActiva: string,
  categoriasRaiz: Categoria[],
): boolean {
  const slugs = new Set<string>()
  if (producto.categoria?.slug) slugs.add(producto.categoria.slug)
  producto.categorias?.forEach(c => {
    if (c.slug) slugs.add(c.slug)
  })
  if (slugs.size === 0) return false

  // Match exacto por slug (producto asignado a esa categoría o subcategoría)
  if (slugs.has(categoriaActiva)) return true

  // Si la activa es una raíz, incluir también productos de sus subcategorías
  const raiz = categoriasRaiz.find(r => r.slug === categoriaActiva)
  if (raiz?.subcategorias?.length) {
    return raiz.subcategorias.some(sub => slugs.has(sub.slug))
  }

  return false
}

export default function ProductosClient({
  productos,
  categorias,
  initialQ,
  initialCategoria,
  initialMarca = '',
  catalogType = 'detal',
}: Props) {
  const router = useGuardedRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(initialQ)
  const [inputValue, setInputValue] = useState(initialQ)
  const [categoriaActiva, setCategoriaActiva] = useState(initialCategoria)
  const [marcasActivas, setMarcasActivas] = useState<string[]>(() =>
    initialMarca
      ? initialMarca.split(',').map(m => m.trim()).filter(Boolean)
      : [],
  )
  const [orden, setOrden] = useState<Orden>('relevancia')
  const [ordenOpen, setOrdenOpen] = useState(false)
  const [marcaOpen, setMarcaOpen] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtroPendiente, setFiltroPendiente] = useState(false)
  const skipUrlSync = useRef(false)

  const aplicarCategoria = useCallback(
    (slug: string, options?: { fromUrl?: boolean }) => {
      if (!options?.fromUrl) {
        signalCatalogNavigating()
        setFiltroPendiente(true)
      }
      startTransition(() => {
        setCategoriaActiva(slug)
        setPagina(1)
      })
    },
    [],
  )

  // Soft nav (Link a ?categoria=…) reutiliza el cliente: sincronizar props → estado
  useEffect(() => {
    skipUrlSync.current = true
    setCategoriaActiva(initialCategoria)
    setFiltroPendiente(false)
  }, [initialCategoria])

  useEffect(() => {
    setQuery(initialQ)
    setInputValue(initialQ)
  }, [initialQ])

  useEffect(() => {
    skipUrlSync.current = true
    setMarcasActivas(
      initialMarca
        ? initialMarca.split(',').map(m => m.trim()).filter(Boolean)
        : [],
    )
  }, [initialMarca])

  // Optimistic update desde el menú lateral (misma página /productos)
  useEffect(() => {
    const onCategoria = (e: Event) => {
      const slug = (e as CustomEvent<{ slug: string }>).detail?.slug
      if (typeof slug !== 'string') return
      aplicarCategoria(slug)
    }
    window.addEventListener('vm:catalog-categoria', onCategoria)
    return () => window.removeEventListener('vm:catalog-categoria', onCategoria)
  }, [aplicarCategoria])

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  // Quitar overlay si la transición ya aplicó el filtro
  useEffect(() => {
    if (!filtroPendiente || isPending) return
    const t = setTimeout(() => setFiltroPendiente(false), 180)
    return () => clearTimeout(t)
  }, [filtroPendiente, isPending, categoriaActiva, productos])

  // Scroll al inicio al cambiar de página (después del render, para que no
  // compita con el reflow/animaciones de la grilla). Se omite el primer render.
  const paginaPrevia = useRef(pagina)
  useEffect(() => {
    if (paginaPrevia.current === pagina) return
    paginaPrevia.current = pagina

    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [pagina])

  // Sync URL
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false
      return
    }
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categoriaActiva) params.set('categoria', categoriaActiva)
    if (marcasActivas.length > 0) params.set('marca', marcasActivas.join(','))
    const search = params.toString()
    const next = search ? `${pathname}?${search}` : pathname
    const current =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : next
    if (current !== next) {
      router.replace(next, { scroll: false })
    }
  }, [query, categoriaActiva, marcasActivas, pathname, router])

  const mostrarCarga = !mounted || isPending || filtroPendiente

  const marcasDisponibles = useMemo(() => {
    const marcas = new Set(
      productos.filter(p => p.marca).map(p => p.marca as string),
    )
    return Array.from(marcas).sort((a, b) => a.localeCompare(b, 'es'))
  }, [productos])

  const productosFiltrados = useMemo(() => {
    let result = [...productos]

    // Filtro búsqueda
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.categoria?.nombre.toLowerCase().includes(q)
      )
    }

    // Filtro categoría: match por slug; si es raíz, incluye sus subcategorías
    if (categoriaActiva) {
      result = result.filter(p =>
        productoCoincideCategoria(p, categoriaActiva, categorias),
      )
    }

    if (marcasActivas.length > 0) {
      const selected = new Set(marcasActivas)
      result = result.filter(p => p.marca != null && selected.has(p.marca))
    }

    // Orden
    switch (orden) {
      case 'precio-asc':
        result.sort((a, b) => getPrecioOrden(a, catalogType) - getPrecioOrden(b, catalogType))
        break
      case 'precio-desc':
        result.sort((a, b) => getPrecioOrden(b, catalogType) - getPrecioOrden(a, catalogType))
        break
      case 'nombre':
        result.sort((a, b) => a.nombre.localeCompare(b.nombre))
        break
    }

    return result
  }, [productos, query, categoriaActiva, marcasActivas, orden, catalogType, categorias])

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA)
  const paginaActual = Math.min(Math.max(1, pagina), Math.max(1, totalPaginas))
  const paginasVisibles = useMemo(
    () => getPaginationChunk(paginaActual, totalPaginas, 5),
    [paginaActual, totalPaginas],
  )
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  )

  // Si el filtro reduce el total de páginas, vuelve a un índice válido
  useEffect(() => {
    if (totalPaginas > 0 && pagina > totalPaginas) {
      setPagina(totalPaginas)
    }
  }, [totalPaginas, pagina])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(inputValue)
  }

  const limpiarFiltros = () => {
    signalCatalogNavigating()
    setFiltroPendiente(true)
    startTransition(() => {
      setQuery('')
      setInputValue('')
      setCategoriaActiva('')
      setMarcasActivas([])
      setOrden('relevancia')
      setPagina(1)
    })
  }

  const toggleMarca = (marca: string) => {
    setMarcasActivas(prev =>
      prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca],
    )
    setPagina(1)
  }

  const marcaValueLabel =
    marcasActivas.length === 0
      ? 'Marcas'
      : marcasActivas.length === 1
        ? marcasActivas[0]
        : `${marcasActivas.length} marcas`

  const categoriaNombre = useMemo(() => {
    if (!categoriaActiva) return undefined
    const raiz = categorias.find(r => r.slug === categoriaActiva)
    if (raiz) return raiz.nombre
    for (const r of categorias) {
      const sub = r.subcategorias?.find(s => s.slug === categoriaActiva)
      if (sub) return sub.nombre
    }
    return undefined
  }, [categorias, categoriaActiva])

  const raizSeleccionada = useMemo(() => {
    const raizDirecta = categorias.find(r => r.slug === categoriaActiva)
    if (raizDirecta) return raizDirecta
    for (const r of categorias) {
      if (r.subcategorias?.some(s => s.slug === categoriaActiva)) return r
    }
    return null
  }, [categorias, categoriaActiva])

  const subcategoriasVisibles = useMemo(() => {
    if (!raizSeleccionada?.subcategorias?.length) return []
    return [...raizSeleccionada.subcategorias]
      .filter(s => s.activa)
      .sort((a, b) => a.orden - b.orden)
  }, [raizSeleccionada])

  const ordenLabels: Record<Orden, string> = {
    relevancia: 'Destacados',
    'precio-asc': 'Menor precio',
    'precio-desc': 'Mayor precio',
    nombre: 'Nombre A-Z',
  }

  const activeFiltersCount =
    (categoriaActiva ? 1 : 0) +
    (marcasActivas.length > 0 ? 1 : 0) +
    (orden !== 'relevancia' ? 1 : 0)

  // Distinguir "catálogo vacío" (sin productos en la BD) de "sin resultados" (por filtros/búsqueda)
  const catalogoVacio = productos.length === 0
  const hayFiltros = Boolean(
    query || categoriaActiva || marcasActivas.length > 0 || orden !== 'relevancia',
  )

  return (
    <div className="mobile-catalog-page relative min-h-screen max-md:pb-20 max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <PageGoldAccent />
      <div className="relative z-10 max-w-7xl mx-auto px-4 max-md:px-4 sm:px-6 lg:px-8">

        {/* ── Mobile: toolbar + filtros drawer ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 md:hidden"
        >
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={13} className="text-[var(--accent-primary)]" />
              <span className="text-[12px] font-bold text-[var(--accent-deep)]">Explorar</span>
            </div>
            <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--text-primary)]">
              {categoriaNombre || 'Catálogo'}
            </h1>
          </div>

          <MobileCatalogToolbar
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSearch={() => setQuery(inputValue)}
            onClearSearch={() => {
              setInputValue('')
              setQuery('')
            }}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFiltersCount={activeFiltersCount}
          />

          {(categoriaActiva || marcasActivas.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {categoriaActiva && categoriaNombre && (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))] bg-[var(--bg-muted)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--accent-deep)]">
                  <span className="truncate">{categoriaNombre}</span>
                  <button
                    type="button"
                    onClick={() => aplicarCategoria('')}
                    aria-label="Quitar categoría"
                    className="shrink-0 rounded-full p-0.5 hover:bg-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {marcasActivas.map(marca => (
                <button
                  key={marca}
                  type="button"
                  onClick={() => toggleMarca(marca)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))] bg-[var(--bg-muted)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--accent-deep)]"
                >
                  <Tag size={10} />
                  {marca}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}

          <MobileFiltersDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={aplicarCategoria}
            marcas={marcasDisponibles}
            marcasActivas={marcasActivas}
            onMarcasChange={next => {
              setMarcasActivas(next)
              setPagina(1)
            }}
            orden={orden}
            onOrdenChange={setOrden}
            onLimpiar={limpiarFiltros}
            resultCount={productosFiltrados.length}
          />
        </motion.section>

        {/* ── Desktop: header + filtros ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 hidden overflow-visible md:block"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[rgba(232,136,181,0.12)] blur-3xl" />

          {/* Título */}
          <div className="relative pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-[12px] font-bold text-[var(--accent-deep)]">
                    Explorar
                  </span>
                </div>
                <h1 className="text-[2rem] font-bold leading-tight text-[var(--text-primary)] sm:text-[2.5rem]">
                  {categoriaNombre || 'Catálogo'}
                </h1>
                <p className="mt-2 max-w-lg text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
                  {categoriaNombre
                    ? `Explora nuestra selección de ${categoriaNombre.toLowerCase()}`
                    : 'Encuentra productos de belleza y cuidado personal'}
                </p>
              </div>

              {mounted && (
                <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-[var(--bg-muted)] px-3.5 py-2 sm:self-auto">
                  <Package size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-[12px] font-bold text-[var(--accent-deep)]">
                    {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Búsqueda + filtros en panel redondeado */}
          <div className="relative z-30 mb-2 overflow-visible rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
              <form onSubmit={handleSearch} className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Buscar por nombre, SKU o categoría…"
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-muted)] py-2.5 pl-10 pr-24 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--placeholder)] focus:border-[var(--accent-primary)] focus:bg-white"
                />
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue('')
                        setQuery('')
                      }}
                      className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-[var(--text-primary)]"
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent-primary)] px-3.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[var(--accent-deep)]"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
                <CatalogCategoryMenu
                  categorias={categorias}
                  categoriaActiva={categoriaActiva}
                  onChange={aplicarCategoria}
                />

                {marcasDisponibles.length > 0 && (
                  <CatalogFilterSelect
                    label="Marca"
                    valueLabel={marcaValueLabel}
                    open={marcaOpen}
                    onOpenChange={setMarcaOpen}
                    active={marcasActivas.length > 0}
                    align="right"
                    panelClassName="w-56"
                  >
                    <CatalogFilterOption
                      active={marcasActivas.length === 0}
                      onClick={() => {
                        setMarcasActivas([])
                        setPagina(1)
                      }}
                    >
                      Todas las marcas
                    </CatalogFilterOption>
                    {marcasDisponibles.map(marca => (
                      <CatalogFilterOption
                        key={marca}
                        active={marcasActivas.includes(marca)}
                        onClick={() => toggleMarca(marca)}
                      >
                        {marca}
                      </CatalogFilterOption>
                    ))}
                  </CatalogFilterSelect>
                )}

                <CatalogFilterSelect
                  label="Ordenar"
                  valueLabel={ordenLabels[orden]}
                  open={ordenOpen}
                  onOpenChange={setOrdenOpen}
                  active={orden !== 'relevancia'}
                  align="right"
                  panelClassName="w-56"
                >
                  {(Object.keys(ordenLabels) as Orden[]).map(key => (
                    <CatalogFilterOption
                      key={key}
                      active={orden === key}
                      onClick={() => {
                        setOrden(key)
                        setOrdenOpen(false)
                      }}
                    >
                      {ordenLabels[key]}
                    </CatalogFilterOption>
                  ))}
                </CatalogFilterSelect>
              </div>
            </div>
          </div>

        </motion.section>

        {/* Contenido a ancho completo — sin sidebar */}
        <div className="mt-2 min-w-0 lg:mt-4">
            {/* Chip de filtro activo (desktop) */}
            {(categoriaActiva || marcasActivas.length > 0 || mostrarCarga) && (
              <div className="mb-4 hidden items-center gap-2.5 md:flex">
                <span className="text-[11px] font-bold text-[var(--text-subtle)]">
                  {mostrarCarga ? 'Actualizando catálogo' : 'Filtrado por'}
                </span>
                {mostrarCarga && (
                  <Loader2 size={14} className="animate-spin text-[var(--accent-primary)]" />
                )}
                {!mostrarCarga && categoriaActiva && categoriaNombre && (
                  <button
                    type="button"
                    onClick={() => aplicarCategoria('')}
                    className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))] bg-[var(--bg-muted)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                  >
                    {categoriaNombre}
                    <X size={12} />
                  </button>
                )}
                {marcasActivas.map(marca => (
                  <button
                    key={marca}
                    type="button"
                    onClick={() => toggleMarca(marca)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border))] bg-[var(--bg-muted)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--accent-deep)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                  >
                    <Tag size={10} />
                    {marca}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* Contador + estado de carga */}
            {mounted && (
              <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
                <p className="text-[11px] font-light uppercase tracking-[1.5px] text-[var(--text-subtle)]">
                  {mostrarCarga && filtroPendiente
                    ? 'Actualizando…'
                    : `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''}`}
                </p>
                {mostrarCarga && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-primary)]">
                    <Loader2 size={12} className="animate-spin" />
                    Cargando
                  </span>
                )}
              </div>
            )}

            {/* Grid productos — mobile */}
            {mostrarCarga ? (
              <ProductGridMobile>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </ProductGridMobile>
            ) : productosPagina.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center md:hidden"
              >
                {catalogoVacio && !hayFiltros ? (
                  <Package size={36} className="text-[var(--text-faint)]" />
                ) : (
                  <Search size={36} className="text-[var(--text-faint)]" />
                )}
                <p className="text-center text-[12px] font-light uppercase tracking-[1px] text-[var(--text-secondary)]">
                  {catalogoVacio && !hayFiltros
                    ? 'Aún no hay productos disponibles'
                    : 'No se encontraron productos'}
                </p>
                {hayFiltros && (
                  <button
                    onClick={limpiarFiltros}
                    className="catalog-gold-cta min-h-[44px] rounded-xl px-5 text-[11px] font-medium uppercase tracking-[1.5px]"
                  >
                    Limpiar filtros
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div layout className="mb-6 md:hidden">
                <ProductGridMobile>
                  <AnimatePresence mode="popLayout">
                    {productosPagina.map((producto, i) => (
                      <motion.div
                        key={producto.id}
                        layout
                        className="h-full"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                      >
                        <ProductCardMobile
                          producto={producto}
                          catalogType={catalogType}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ProductGridMobile>
              </motion.div>
            )}

            {/* Grid productos — desktop (más columnas sin sidebar) */}
            {mostrarCarga ? (
              <div className="mb-10 mt-3 hidden grid-cols-2 gap-px sm:grid-cols-3 md:grid lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : productosPagina.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden flex-col items-center justify-center gap-4 px-6 py-20 text-center md:flex"
              >
                {catalogoVacio && !hayFiltros ? (
                  <Package size={40} className="text-[var(--text-faint)]" />
                ) : (
                  <Search size={40} className="text-[var(--text-faint)]" />
                )}
                <p className="text-sm font-light uppercase tracking-[0.5px] text-[var(--text-secondary)]">
                  {catalogoVacio && !hayFiltros
                    ? 'Aún no hay productos disponibles'
                    : 'No se encontraron productos'}
                </p>
                {catalogoVacio && !hayFiltros ? (
                  <p className="max-w-sm text-[12px] font-light text-[var(--text-subtle)]">
                    Vuelve pronto, estamos preparando el catálogo.
                  </p>
                ) : (
                  <button
                    onClick={limpiarFiltros}
                    className="catalog-gold-cta rounded-full px-5 py-2.5 text-[12px] font-bold"
                  >
                    Limpiar filtros
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                layout
                className="mb-10 mt-3 hidden grid-cols-2 gap-4 sm:grid-cols-3 md:grid lg:grid-cols-4 lg:gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {productosPagina.map((producto, i) => (
                    <motion.div
                      key={producto.id}
                      layout
                      className="h-full"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <ProductCard producto={producto} catalogType={catalogType} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Paginación — bloques fijos de 5 (1–5, 6–10, …) */}
            {totalPaginas > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-1.5 pb-2 pt-2 max-md:px-1 sm:gap-2 md:pb-12"
              >
                <button
                  type="button"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  aria-label="Página anterior"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-[12px] font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-35 md:px-4"
                >
                  <ChevronLeft size={14} className="md:hidden" />
                  <span className="hidden sm:inline">← Anterior</span>
                  <span className="sm:hidden">Ant</span>
                </button>

                <div className="flex items-center gap-1" role="list">
                  {paginasVisibles.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPagina(num)}
                      aria-label={`Ir a página ${num}`}
                      aria-current={paginaActual === num ? 'page' : undefined}
                      className={`h-10 min-w-10 rounded-full border text-[13px] font-bold tabular-nums transition-all ${
                        paginaActual === num
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  aria-label="Página siguiente"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-[12px] font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-primary)] hover:text-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-35 md:px-4"
                >
                  <span className="hidden sm:inline">Siguiente →</span>
                  <span className="sm:hidden">Sig</span>
                  <ChevronRight size={14} className="md:hidden" />
                </button>
              </motion.div>
            )}
        </div>

      </div>
    </div>
  )
}