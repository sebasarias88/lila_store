'use client'

import { useEffect, useMemo, useState } from 'react'
import { Categoria } from '@/types'
import MobileBottomSheet from '@/components/catalog/mobile/MobileBottomSheet'
import MobileFilterDropdown, { FilterOption } from '@/components/catalog/mobile/MobileFilterDropdown'
import MobileCategoryFilter from '@/components/catalog/mobile/MobileCategoryFilter'

type Orden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre'
type OpenDropdown = 'orden' | 'categoria' | 'marca' | null

type MobileFiltersDrawerProps = {
  open: boolean
  onClose: () => void
  categorias: Categoria[]
  categoriaActiva: string
  onCategoriaChange: (slug: string) => void
  marcas?: string[]
  marcasActivas?: string[]
  onMarcasChange?: (marcas: string[]) => void
  orden: Orden
  onOrdenChange: (orden: Orden) => void
  onLimpiar: () => void
  resultCount: number
}

const ordenOptions: FilterOption[] = [
  { value: 'relevancia', label: 'Destacados' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Nombre A-Z' },
]

export default function MobileFiltersDrawer({
  open,
  onClose,
  categorias,
  categoriaActiva,
  onCategoriaChange,
  marcas = [],
  marcasActivas = [],
  onMarcasChange,
  orden,
  onOrdenChange,
  onLimpiar,
  resultCount,
}: MobileFiltersDrawerProps) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const tieneFiltros =
    Boolean(categoriaActiva) || marcasActivas.length > 0 || orden !== 'relevancia'

  const marcaOptions = useMemo<FilterOption[]>(
    () => [
      { value: '', label: 'Todas las marcas' },
      ...marcas.map(m => ({ value: m, label: m })),
    ],
    [marcas],
  )

  useEffect(() => {
    if (!open) setOpenDropdown(null)
  }, [open])

  const footer = (
    <div className="mobile-filters-footer flex gap-3">
      {tieneFiltros ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="mobile-filters-clear min-h-[50px] flex-1 rounded-full text-[13px] font-bold"
        >
          Limpiar
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="catalog-gold-cta min-h-[50px] flex-[1.35] rounded-full text-[13px] font-bold"
      >
        Ver resultados
      </button>
    </div>
  )

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title="Filtros"
      subtitle={`${resultCount} producto${resultCount !== 1 ? 's' : ''}`}
      height={
        openDropdown === 'categoria' || openDropdown === 'marca' ? 'tall' : 'auto'
      }
      footer={footer}
    >
      <div
        className={`mobile-filters-compact px-5 pt-2 ${
          openDropdown === 'categoria' || openDropdown === 'marca'
            ? 'mobile-filters-compact--open pb-6'
            : 'pb-4'
        }`}
      >
        <MobileFilterDropdown
          label="Ordenar"
          value={orden}
          options={ordenOptions}
          onChange={v => onOrdenChange(v as Orden)}
          open={openDropdown === 'orden'}
          onOpenChange={next => setOpenDropdown(next ? 'orden' : null)}
          listClassName="max-h-none"
        />

        <MobileCategoryFilter
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onChange={onCategoriaChange}
          open={openDropdown === 'categoria'}
          onOpenChange={next => setOpenDropdown(next ? 'categoria' : null)}
        />

        {marcas.length > 0 && onMarcasChange && (
          <MobileFilterDropdown
            label="Marca"
            multiple
            values={marcasActivas}
            onValuesChange={onMarcasChange}
            options={marcaOptions}
            open={openDropdown === 'marca'}
            onOpenChange={next => setOpenDropdown(next ? 'marca' : null)}
            searchable
            searchPlaceholder="Buscar marca…"
            listClassName="max-h-[min(42dvh,260px)]"
          />
        )}
      </div>
    </MobileBottomSheet>
  )
}
