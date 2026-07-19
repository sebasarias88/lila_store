'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import MobileDrawer from '@/components/catalog/mobile/MobileDrawer'
import {
  signalCatalogCategoria,
  signalCatalogNavigating,
} from '@/components/catalog/NavigationProgress'

type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
  nombreNegocio: string
  categorias: Categoria[]
  catalogType?: CatalogType
}

function getActiveSubs(cat: Categoria): Categoria[] {
  return (cat.subcategorias || [])
    .filter(s => s.activa !== false)
    .sort((a, b) => a.orden - b.orden)
}

/** Si llega lista plana (con padre_id), arma el árbol de raíces. */
function normalizeCategorias(categorias: Categoria[]): Categoria[] {
  const hasNested = categorias.some(c => (c.subcategorias?.length ?? 0) > 0)
  if (hasNested) {
    return categorias
      .filter(c => !c.padre_id)
      .map(c => ({
        ...c,
        subcategorias: getActiveSubs(c),
      }))
      .sort((a, b) => a.orden - b.orden)
  }

  const roots = categorias
    .filter(c => !c.padre_id)
    .sort((a, b) => a.orden - b.orden)

  if (roots.length === 0) {
    return [...categorias].sort((a, b) => a.orden - b.orden)
  }

  return roots.map(root => ({
    ...root,
    subcategorias: categorias
      .filter(c => c.padre_id === root.id && c.activa !== false)
      .sort((a, b) => a.orden - b.orden),
  }))
}

export default function MobileNavDrawer({
  open,
  onClose,
  nombreNegocio,
  categorias,
  catalogType = 'detal',
}: MobileNavDrawerProps) {
  const pathname = usePathname()
  const router = useGuardedRouter()
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [activeCategoria, setActiveCategoria] = useState('')

  const homeHref = catalogPath(catalogType, '/')
  const productosHref = catalogPath(catalogType, '/productos')
  const roots = useMemo(() => normalizeCategorias(categorias), [categorias])
  const onProductos =
    pathname === productosHref || pathname.startsWith(`${productosHref}/`)

  const goToCategoria = (slug: string) => {
    onClose()
    signalCatalogNavigating()
    setActiveCategoria(slug)
    if (onProductos) {
      // Mismo listado: actualiza el filtro al instante + URL
      signalCatalogCategoria(slug)
      const href = slug
        ? `${productosHref}?categoria=${encodeURIComponent(slug)}`
        : productosHref
      router.replace(href, { scroll: false })
      return
    }
    router.push(
      slug
        ? `${productosHref}?categoria=${encodeURIComponent(slug)}`
        : productosHref,
    )
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    setActiveCategoria(new URLSearchParams(window.location.search).get('categoria') || '')
  }, [pathname, open])

  const isNavActive = (href: string) => {
    if (href === homeHref) {
      return pathname === href || pathname === `${href}/`
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isCatActive = (slug: string) => activeCategoria === slug

  useEffect(() => {
    if (!open) {
      setExpandedSlug(null)
      return
    }
    for (const cat of roots) {
      const subs = getActiveSubs(cat)
      if (subs.some(s => s.slug === activeCategoria)) {
        setExpandedSlug(cat.slug)
        return
      }
    }
  }, [open, activeCategoria, roots])

  const navLinks = [
    { href: homeHref, label: 'Inicio' },
    { href: productosHref, label: 'Catálogo' },
  ]

  const toggleExpand = (slug: string) => {
    setExpandedSlug(prev => (prev === slug ? null : slug))
  }

  const linkClass = (active: boolean, indented = false) =>
    `mb-1 flex min-h-[48px] items-center rounded-full text-[13px] font-bold transition-colors ${
      indented ? 'pl-8 pr-4' : 'px-4'
    } ${
      active
        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
        : 'text-[var(--text-secondary)] active:bg-[var(--bg-muted)] active:text-[var(--accent-deep)]'
    }`

  return (
    <MobileDrawer
      open={open}
      onClose={onClose}
      side="left"
      header={
        <div className="min-w-0 pr-2">
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles size={14} className="shrink-0 text-[var(--accent-primary)]" />
            <span className="text-[11px] font-bold text-[var(--text-subtle)]">
              Menú
            </span>
          </div>
          <p className="brand-wordmark truncate text-[18px] text-[var(--accent-deep)]">
            {nombreNegocio}
          </p>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`mb-1 flex min-h-[48px] items-center rounded-full px-4 text-[13px] font-bold transition-colors ${
                isNavActive(href) && !activeCategoria
                  ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                  : 'text-[var(--text-secondary)] active:bg-[var(--bg-muted)]'
              }`}
            >
              {label}
            </Link>
          ))}

          <Link
            href={isNavActive(homeHref) ? '#ofertas' : `${homeHref}#ofertas`}
            onClick={onClose}
            className="mb-1 flex min-h-[48px] items-center rounded-full px-4 text-[13px] font-bold text-[var(--text-secondary)] active:bg-[var(--bg-muted)]"
          >
            Ofertas
          </Link>
          <Link
            href={isNavActive(homeHref) ? '#novedades' : `${homeHref}#novedades`}
            onClick={onClose}
            className="mb-1 flex min-h-[48px] items-center rounded-full px-4 text-[13px] font-bold text-[var(--text-secondary)] active:bg-[var(--bg-muted)]"
          >
            Novedades
          </Link>
          {roots.length > 0 && (
            <>
              <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-faint)]">
                Categorías
              </p>
              {roots.map(cat => {
                const subcats = getActiveSubs(cat)
                const hasSubs = subcats.length > 0
                const isExpanded = expandedSlug === cat.slug
                const rootActive = isCatActive(cat.slug)
                const childActive = subcats.some(s => isCatActive(s.slug))

                if (!hasSubs) {
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => goToCategoria(cat.slug)}
                      className={linkClass(rootActive)}
                    >
                      {cat.nombre}
                    </button>
                  )
                }

                return (
                  <div key={cat.id} className="mb-1">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(cat.slug)}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-2 rounded-full px-4 text-left text-[13px] font-bold transition-colors ${
                        rootActive || childActive || isExpanded
                          ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
                          : 'text-[var(--text-secondary)] active:bg-[var(--bg-muted)]'
                      }`}
                    >
                      <span className="truncate">{cat.nombre}</span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.75}
                        className={`shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-[var(--accent-primary)]' : 'text-[var(--text-subtle)]'
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => goToCategoria(cat.slug)}
                            className={linkClass(rootActive, true)}
                          >
                            Todo {cat.nombre.toLowerCase()}
                          </button>
                          {subcats.map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => goToCategoria(sub.slug)}
                              className={linkClass(isCatActive(sub.slug), true)}
                            >
                              {sub.nombre}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </>
          )}
        </nav>
      </div>
    </MobileDrawer>
  )
}
