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
import type { CatalogType } from '@/lib/catalog'
import type { CatalogOrden } from '@/lib/catalog-productos'
import { productosBaseFromPathname } from '@/lib/catalog'
import { getPaginationChunk } from '@/lib/pagination'
import { Search, X, ChevronLeft, ChevronRight, Loader2, Sparkles, Heart } from 'lucide-react'
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
  catalogType?: CatalogType
  page: number
  pageSize: number
  total: number
  totalPages: number
  orden: CatalogOrden
}

type Orden = CatalogOrden

export default function ProductosClient({
  productos,
  categorias,
  initialQ,
  initialCategoria,
  catalogType = 'detal',
  page,
  total,
  totalPages,
  orden,
}: Props) {
  const router = useGuardedRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [inputValue, setInputValue] = useState(initialQ)
  const [ordenOpen, setOrdenOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtroPendiente, setFiltroPendiente] = useState(false)

  const query = initialQ
  const categoriaActiva = initialCategoria
  const paginaActual = Math.min(Math.max(1, page), Math.max(1, totalPages || 1))

  const pushCatalog = useCallback(
    (next: {
      q?: string
      categoria?: string
      page?: number
      orden?: Orden
    }) => {
      const params = new URLSearchParams()
      const q = next.q !== undefined ? next.q : query
      const cat = next.categoria !== undefined ? next.categoria : categoriaActiva
      const p = next.page !== undefined ? next.page : paginaActual
      const o = next.orden !== undefined ? next.orden : orden
      if (q.trim()) params.set('q', q.trim())
      if (o && o !== 'relevancia') params.set('orden', o)
      if (p > 1) params.set('page', String(p))

      const base = productosBaseFromPathname(pathname)
      const path = cat.trim()
        ? `${base}/categoria/${encodeURIComponent(cat.trim())}`
        : base
      const search = params.toString()
      const href = search ? `${path}?${search}` : path
      signalCatalogNavigating()
      setFiltroPendiente(true)
      startTransition(() => {
        router.push(href, { scroll: false })
      })
    },
    [query, categoriaActiva, paginaActual, orden, pathname, router],
  )

  const aplicarCategoria = useCallback(
    (slug: string) => {
      pushCatalog({ categoria: slug, page: 1 })
    },
    [pushCatalog],
  )

  useEffect(() => {
    setInputValue(initialQ)
  }, [initialQ])

  useEffect(() => {
    setFiltroPendiente(false)
  }, [productos, page, initialQ, initialCategoria, orden])

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

  useEffect(() => {
    if (!filtroPendiente || isPending) return
    const t = setTimeout(() => setFiltroPendiente(false), 180)
    return () => clearTimeout(t)
  }, [filtroPendiente, isPending, categoriaActiva, productos])

  const paginaPrevia = useRef(paginaActual)
  useEffect(() => {
    if (paginaPrevia.current === paginaActual) return
    paginaPrevia.current = paginaActual
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [paginaActual])

  const mostrarCarga = !mounted || isPending || filtroPendiente
  const productosPagina = productos
  const paginasVisibles = useMemo(
    () => getPaginationChunk(paginaActual, totalPages, 5),
    [paginaActual, totalPages],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    pushCatalog({ q: inputValue, page: 1 })
  }

  const limpiarFiltros = () => {
    setInputValue('')
    pushCatalog({ q: '', categoria: '', orden: 'relevancia', page: 1 })
  }

  const setOrden = (value: Orden) => {
    pushCatalog({ orden: value, page: 1 })
  }

  const setPagina = (value: number | ((prev: number) => number)) => {
    const next = typeof value === 'function' ? value(paginaActual) : value
    pushCatalog({ page: next })
  }

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

  const ordenLabels: Record<Orden, string> = {
    relevancia: 'Recomendados ✨',
    'precio-asc': 'Precio bajito',
    'precio-desc': 'Precio alto',
    nombre: 'A → Z',
  }

  const activeFiltersCount =
    (categoriaActiva ? 1 : 0) + (orden !== 'relevancia' ? 1 : 0)

  const catalogoVacio = total === 0 && !query && !categoriaActiva
  const hayFiltros = Boolean(query || categoriaActiva || orden !== 'relevancia')

  const tituloPagina = categoriaNombre || 'Todo lo cute'
  const subtituloPagina = categoriaNombre
    ? `Tu selección favorita de ${categoriaNombre.toLowerCase()} 💕`
    : 'Belleza, skincare y cuidados para consentirte ✨'

  const contadorLabel = total === 1 ? '1 tesoro' : `${total} tesoros`

  return (
    <div className="mobile-catalog-page relative min-h-screen bg-[var(--bg-base)] max-md:pb-20 max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <PageGoldAccent />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[rgba(169,137,224,0.08)] to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 max-md:px-4 sm:px-6 lg:px-8">

        {/* ── Mobile: toolbar + filtros drawer ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 md:hidden"
        >
          <div className="mb-5">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3 py-1.5">
              <Sparkles size={13} className="text-[var(--accent-primary)]" />
              <span className="text-[12px] font-bold text-[var(--accent-deep)]">Explorar ✨</span>
            </div>
            <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--text-primary)]">
              {tituloPagina}
            </h1>
            <p className="mt-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
              {subtituloPagina}
            </p>
          </div>

          <MobileCatalogToolbar
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSearch={() => pushCatalog({ q: inputValue, page: 1 })}
            onClearSearch={() => {
              setInputValue('')
              pushCatalog({ q: '', page: 1 })
            }}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFiltersCount={activeFiltersCount}
          />

          {categoriaActiva && categoriaNombre && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
            </div>
          )}

          <MobileFiltersDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={aplicarCategoria}
            orden={orden}
            onOrdenChange={setOrden}
            onLimpiar={limpiarFiltros}
            resultCount={total}
          />
        </motion.section>

        {/* ── Desktop: header + filtros ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 hidden overflow-visible md:block"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[rgba(169,137,224,0.14)] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 top-16 h-36 w-36 rounded-full bg-[rgba(232,160,200,0.1)] blur-3xl" />

          <div className="relative pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3.5 py-1.5">
                  <Sparkles size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-[12px] font-bold text-[var(--accent-deep)]">
                    Explorar ✨
                  </span>
                </div>
                <h1 className="text-[2rem] font-bold leading-tight text-[var(--text-primary)] sm:text-[2.5rem]">
                  {tituloPagina}
                </h1>
                <p className="mt-2 max-w-lg text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
                  {subtituloPagina}
                </p>
              </div>

              {mounted && (
                <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border)] bg-white px-4 py-2 shadow-[var(--shadow-soft)] sm:self-auto">
                  <Heart size={14} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
                  <span className="text-[12px] font-bold text-[var(--accent-deep)]">
                    {contadorLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-30 mb-2 overflow-visible rounded-[28px] border border-[var(--border)] bg-white/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
              <form onSubmit={handleSearch} className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--accent-primary)]"
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Busca tu favorito… ✨"
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-muted)] py-2.5 pl-10 pr-24 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--placeholder)] focus:border-[var(--accent-primary)] focus:bg-white"
                />
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue('')
                        pushCatalog({ q: '', page: 1 })
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

        <div className="mt-2 min-w-0 lg:mt-4">
            {(categoriaActiva || mostrarCarga) && (
              <div className="mb-4 hidden items-center gap-2.5 md:flex">
                <span className="text-[11px] font-bold text-[var(--text-subtle)]">
                  {mostrarCarga ? 'Actualizando… ✨' : 'Filtrado por'}
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
              </div>
            )}

            {mounted && (
              <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
                <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                  {mostrarCarga && filtroPendiente
                    ? 'Actualizando… ✨'
                    : contadorLabel}
                </p>
                {mostrarCarga && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-primary)]">
                    <Loader2 size={12} className="animate-spin" />
                    Cargando
                  </span>
                )}
              </div>
            )}

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
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EEE8FC] to-[#F8EAF4] shadow-[var(--shadow-soft)]">
                  {catalogoVacio && !hayFiltros ? (
                    <Heart size={32} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
                  ) : (
                    <Sparkles size={32} className="text-[var(--accent-primary)]" />
                  )}
                </div>
                <p className="text-[15px] font-bold text-[var(--text-primary)]">
                  {catalogoVacio && !hayFiltros
                    ? 'Aún no hay tesoros por aquí 💕'
                    : 'No encontramos nada cute… ✨'}
                </p>
                <p className="max-w-xs text-[13px] font-medium text-[var(--text-secondary)]">
                  {catalogoVacio && !hayFiltros
                    ? 'Vuelve pronto, estamos preparando el catálogo con mucho amor.'
                    : 'Prueba otra búsqueda o limpia los filtros para ver más.'}
                </p>
                {hayFiltros && (
                  <button
                    onClick={limpiarFiltros}
                    className="catalog-gold-cta min-h-[44px] rounded-full px-5 text-[12px] font-bold"
                  >
                    Limpiar filtros ✨
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

            {mostrarCarga ? (
              <div className="mb-10 mt-3 hidden grid-cols-2 gap-4 sm:grid-cols-3 md:grid lg:grid-cols-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : productosPagina.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden flex-col items-center justify-center gap-5 rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[#F9F6FF] to-[#F8EAF4] px-6 py-20 text-center shadow-[var(--shadow-soft)] md:flex"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]">
                  {catalogoVacio && !hayFiltros ? (
                    <Heart size={36} className="fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
                  ) : (
                    <Sparkles size={36} className="text-[var(--accent-primary)]" />
                  )}
                </div>
                <div>
                  <p className="text-[1.25rem] font-bold text-[var(--text-primary)]">
                    {catalogoVacio && !hayFiltros
                      ? 'Aún no hay tesoros por aquí 💕'
                      : 'No encontramos nada cute… ✨'}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[14px] font-medium text-[var(--text-secondary)]">
                    {catalogoVacio && !hayFiltros
                      ? 'Vuelve pronto, estamos preparando el catálogo con mucho amor.'
                      : 'Prueba otra búsqueda o limpia los filtros para ver más favoritos.'}
                  </p>
                </div>
                {catalogoVacio && !hayFiltros ? null : (
                  <button
                    onClick={limpiarFiltros}
                    className="catalog-gold-cta rounded-full px-6 py-3 text-[13px] font-bold"
                  >
                    Limpiar filtros ✨
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

            {totalPages > 1 && (
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
                  onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
                  disabled={paginaActual === totalPages}
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
