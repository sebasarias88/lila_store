'use client'

import { CheckCircle2, ChevronRight, CornerDownRight, Edit2, Star, Tag, Trash2, XCircle } from 'lucide-react'
import { Producto } from '@/types'

type MobileProductCardProps = {
  producto: Producto
  formatPrecio: (precio: number) => string
  parentCategoria?: string | null
  onEdit: () => void
  onDelete: () => void
  onToggleDisponible: () => void
}

export default function MobileProductCard({
  producto,
  formatPrecio,
  parentCategoria,
  onEdit,
  onDelete,
  onToggleDisponible,
}: MobileProductCardProps) {
  const imagen = producto.imagenes?.[0]

  return (
    <article className="mobile-admin-product-card overflow-hidden rounded-xl border border-[rgba(169,137,224,0.22)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
      <div className="flex gap-3 p-3">
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-[rgba(169,137,224,0.18)] bg-[var(--bg-muted)]">
          {imagen ? (
            <img src={imagen} alt={producto.nombre} className="h-full w-full bg-white object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-faint)]">
              Sin foto
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-light text-[var(--text-primary)]">{producto.nombre}</h3>
              {producto.sku ? (
                <p className="mt-0.5 truncate text-[10px] text-[var(--text-subtle)]">SKU · {producto.sku}</p>
              ) : null}
              {producto.marca ? (
                <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{producto.marca}</p>
              ) : null}
            </div>
            {producto.destacado ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgba(169,137,224,0.3)] bg-[rgba(169,137,224,0.1)] px-2 py-0.5 text-[9px] uppercase tracking-[0.6px] text-[var(--accent-primary)]">
                <Star size={9} className="fill-[var(--accent-primary)]" />
                Top
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[12px] font-light text-[var(--accent-secondary)]">{formatPrecio(producto.precio)}</p>
          {producto.precio_mayoreo != null ? (
            <p className="text-[10px] text-[var(--text-subtle)]">
              Mayorista · {formatPrecio(producto.precio_mayoreo)}
            </p>
          ) : null}
          {producto.categoria ? (
            <span
              className={`mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-1.5 pr-2 text-[10px] ${
                parentCategoria
                  ? 'border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.08)]'
                  : 'border-[rgba(169,137,224,0.25)] bg-[rgba(169,137,224,0.08)]'
              }`}
            >
              {parentCategoria ? (
                <CornerDownRight size={10} className="shrink-0 text-blue-400" strokeWidth={1.75} />
              ) : (
                <Tag size={10} className="shrink-0 text-[var(--accent-secondary)]" strokeWidth={1.75} />
              )}
              {parentCategoria && (
                <>
                  <span className="max-w-[80px] shrink-0 truncate text-[var(--text-faint)]">
                    {parentCategoria}
                  </span>
                  <ChevronRight size={9} className="shrink-0 text-[var(--text-faint)]" />
                </>
              )}
              <span className="truncate text-[var(--text-secondary)]">{producto.categoria.nombre}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(169,137,224,0.12)] px-3 py-2.5">
        <button
          type="button"
          onClick={onToggleDisponible}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-[10px] uppercase tracking-[0.8px] ${
            producto.disponible
              ? 'text-emerald-400'
              : 'text-red-400'
          }`}
        >
          {producto.disponible ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {producto.disponible ? 'Disponible' : 'Agotado'}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[rgba(169,137,224,0.1)] active:text-[var(--accent-primary)]"
            aria-label="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[rgba(248,113,113,0.1)] active:text-red-400"
            aria-label="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}
