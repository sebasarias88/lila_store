'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { CatalogType } from '@/lib/catalog'
import type { Categoria } from '@/types'
import DesktopSearchOverlay from '@/components/catalog/DesktopSearchOverlay'

type Props = {
  catalogType?: CatalogType
  categorias?: Categoria[]
  /** Estilos cuando el nav va sobre foto oscura */
  light?: boolean
}

/**
 * Lupa del navbar desktop → abre overlay de búsqueda.
 */
export default function DesktopNavSearch({
  catalogType = 'detal',
  categorias = [],
  light = false,
}: Props) {
  const [open, setOpen] = useState(false)

  const iconClass = light
    ? 'border-white/40 bg-white/15 text-white hover:border-white hover:bg-white hover:text-[var(--accent-deep)]'
    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent-deep)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar productos"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${iconClass}`}
      >
        <Search size={16} strokeWidth={1.75} />
      </button>

      <DesktopSearchOverlay
        open={open}
        onClose={() => setOpen(false)}
        catalogType={catalogType}
        categorias={categorias}
      />
    </>
  )
}
