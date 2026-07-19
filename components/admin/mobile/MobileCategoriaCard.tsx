'use client'

import { CheckCircle2, Edit2, Trash2, XCircle } from 'lucide-react'
import { Categoria } from '@/types'

type MobileCategoriaCardProps = {
  categoria: Categoria & { esSubcategoria?: boolean }
  onEdit: () => void
  onDelete: () => void
  onToggleActiva: () => void
}

export default function MobileCategoriaCard({
  categoria,
  onEdit,
  onDelete,
  onToggleActiva,
}: MobileCategoriaCardProps) {
  return (
    <article
      className={`mobile-admin-categoria-card overflow-hidden rounded-xl border border-[rgba(232,136,181,0.22)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] ${
        categoria.esSubcategoria ? 'ml-4' : ''
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[rgba(232,136,181,0.18)] bg-[var(--bg-muted)]">
          {categoria.imagen_url ? (
            <img
              src={categoria.imagen_url}
              alt={categoria.nombre}
              className="h-full w-full bg-white object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] text-[var(--text-faint)]">
              Sin img
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-light text-[var(--text-primary)]">
                {categoria.nombre}
              </h3>
              {categoria.esSubcategoria ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.6px] text-[var(--text-subtle)]">
                  Subcategoría
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--text-muted)]">
              #{categoria.orden}
            </span>
          </div>
          <p className="mt-1.5 truncate font-mono text-[10px] text-[var(--text-subtle)]">/{categoria.slug}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(232,136,181,0.12)] px-3 py-2.5">
        <button
          type="button"
          onClick={onToggleActiva}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-[10px] uppercase tracking-[0.8px] ${
            categoria.activa ? 'text-emerald-400' : 'text-[var(--text-muted)]'
          }`}
        >
          {categoria.activa ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {categoria.activa ? 'Activa' : 'Inactiva'}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[rgba(232,136,181,0.1)] active:text-[var(--accent-primary)]"
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
