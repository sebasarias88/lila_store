'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  CornerDownRight,
  FolderTree,
  ImageIcon,
  ChevronDown,
} from 'lucide-react'
import { Categoria } from '@/types'
import { AdminTableStatus, AdminTableActions } from '@/components/admin/AdminTable'
import { categoriaTieneDescuentoActivo } from '@/lib/descuentos'

type GrupoCategoria = { root: Categoria; subs: Categoria[] }

const SUBS_VISIBLES = 4

export function CategoriaGrupoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
      <div className="relative flex items-center gap-4 bg-gradient-to-r from-[rgba(169,137,224,0.04)] to-transparent p-4">
        <span className="absolute inset-y-0 left-0 w-[3px] bg-[rgba(169,137,224,0.15)]" />
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-muted)]" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--bg-muted)]" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--bg-muted)]" />
        </div>
        <div className="hidden h-7 w-20 shrink-0 animate-pulse rounded-full bg-[var(--bg-muted)] sm:block" />
        <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
      </div>
      <div className="border-t border-[var(--border-card)] bg-[rgba(169,137,224,0.02)]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[var(--border-card)] py-2.5 pl-9 pr-4 last:border-b-0"
          >
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
            <div className="h-3.5 w-28 flex-1 animate-pulse rounded bg-[var(--bg-muted)]" />
            <div className="hidden h-6 w-16 shrink-0 animate-pulse rounded-full bg-[var(--bg-muted)] sm:block" />
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Thumb({
  src,
  alt,
  size = 'sm',
  fallback,
}: {
  src?: string | null
  alt: string
  size?: 'sm' | 'lg'
  fallback: React.ReactNode
}) {
  const dim = size === 'lg' ? 'h-14 w-14 rounded-xl' : 'h-9 w-9 rounded-lg'
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[var(--bg-muted)] ring-1 ring-[rgba(169,137,224,0.22)] ${
        size === 'lg' ? 'shadow-[0_6px_18px_rgba(0,0,0,0.18)]' : ''
      } ${dim}`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full bg-white object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgba(169,137,224,0.12)] to-[rgba(169,137,224,0.03)] text-[rgba(169,137,224,0.55)]">
          {fallback}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.12)] to-transparent" />
    </div>
  )
}

export default function CategoriaGrupoCard({
  grupo,
  index,
  onEdit,
  onDelete,
  onToggleActiva,
}: {
  grupo: GrupoCategoria
  index: number
  onEdit: (cat: Categoria) => void
  onDelete: (cat: Categoria) => void
  onToggleActiva: (cat: Categoria) => void
}) {
  const { root, subs } = grupo
  const [expanded, setExpanded] = useState(false)
  const hayMas = subs.length > SUBS_VISIBLES
  const subsVisibles = expanded ? subs : subs.slice(0, SUBS_VISIBLES)

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="group overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(169,137,224,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
    >
      {/* Cabecera — categoría principal */}
      <div className="relative flex items-center gap-3 bg-gradient-to-r from-[rgba(169,137,224,0.06)] to-transparent p-3.5 sm:gap-4 sm:p-4">
        <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[var(--accent-secondary)] via-[var(--accent-primary)] to-[rgba(169,137,224,0.1)]" />

        <Thumb
          src={root.imagen_url}
          alt={root.nombre}
          size="lg"
          fallback={<FolderTree size={20} />}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-medium tracking-[0.2px] text-[var(--text-primary)]">
              {root.nombre}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgba(169,137,224,0.28)] bg-[rgba(169,137,224,0.1)] px-2 py-0.5 text-[10px] font-medium tracking-[0.3px] text-[var(--accent-secondary)]">
              <FolderTree size={10} className="opacity-80" />
              {subs.length} {subs.length === 1 ? 'subcategoría' : 'subcategorías'}
            </span>
            {categoriaTieneDescuentoActivo(root, 'detal') && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(169,137,224,0.35)] bg-[rgba(169,137,224,0.12)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                D -{root.descuento_porcentaje}%
              </span>
            )}
            {categoriaTieneDescuentoActivo(root, 'mayoreo') && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.1)] px-2 py-0.5 text-[10px] font-medium text-blue-400">
                M -{root.descuento_porcentaje_mayoreo}%
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[var(--text-subtle)]">
            <span className="uppercase tracking-[0.5px]">Orden {root.orden}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AdminTableStatus
            label={root.activa ? 'Activa' : 'Inactiva'}
            icon={root.activa ? CheckCircle2 : XCircle}
            variant={root.activa ? 'success' : 'neutral'}
            onClick={() => onToggleActiva(root)}
            title={root.activa ? 'Desactivar categoría' : 'Activar categoría'}
          />
          <AdminTableActions
            onEdit={() => onEdit(root)}
            onDelete={() => onDelete(root)}
          />
        </div>
      </div>

      {/* Cuerpo — subcategorías */}
      {subs.length > 0 ? (
        <div className="border-t border-[var(--border-card)] bg-[rgba(169,137,224,0.02)]">
          {subsVisibles.map(sub => (
            <div
              key={sub.id}
              className="group/sub relative flex items-center gap-3 border-b border-[var(--border-card)] py-2.5 pl-6 pr-3.5 transition-colors last:border-b-0 hover:bg-[rgba(169,137,224,0.05)] sm:pl-9 sm:pr-4"
            >
              <CornerDownRight
                size={14}
                className="absolute left-2 shrink-0 text-[rgba(169,137,224,0.4)] transition-colors group-hover/sub:text-[var(--accent-primary)] sm:left-3.5"
              />
              <Thumb
                src={sub.imagen_url}
                alt={sub.nombre}
                fallback={<ImageIcon size={14} />}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-normal text-[var(--text-primary)]">
                    {sub.nombre}
                  </p>
                  {categoriaTieneDescuentoActivo(sub, 'detal') && (
                    <span className="text-[10px] font-medium text-[var(--accent-primary)]">
                      D -{sub.descuento_porcentaje}%
                    </span>
                  )}
                  {categoriaTieneDescuentoActivo(sub, 'mayoreo') && (
                    <span className="text-[10px] font-medium text-blue-400">
                      M -{sub.descuento_porcentaje_mayoreo}%
                    </span>
                  )}
                </div>
              </div>
              <AdminTableStatus
                label={sub.activa ? 'Activa' : 'Inactiva'}
                icon={sub.activa ? CheckCircle2 : XCircle}
                variant={sub.activa ? 'success' : 'neutral'}
                onClick={() => onToggleActiva(sub)}
                title={sub.activa ? 'Desactivar subcategoría' : 'Activar subcategoría'}
              />
              <AdminTableActions
                onEdit={() => onEdit(sub)}
                onDelete={() => onDelete(sub)}
              />
            </div>
          ))}

          {hayMas && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.8px] text-[var(--accent-primary)] transition-colors hover:bg-[rgba(169,137,224,0.06)]"
            >
              {expanded
                ? 'Ver menos'
                : `Ver ${subs.length - SUBS_VISIBLES} más`}
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-dashed border-[var(--border-card)] px-4 py-3 pl-6 text-[11px] font-light italic text-[var(--text-subtle)] sm:pl-9">
          <CornerDownRight size={13} className="text-[rgba(169,137,224,0.3)]" />
          Sin subcategorías aún
        </div>
      )}
    </motion.article>
  )
}
