'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, MessageCircle, Sparkles, Store } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Categoria } from '@/types'
import { catalogPath, catalogCategoriaPath, type CatalogType } from '@/lib/catalog'
import { useGuardedRouter } from '@/lib/useGuardedRouter'
import { resolveWhatsAppNumero } from '@/lib/negocio'
import { buildWhatsAppUrl, mensajeConsultaWhatsApp } from '@/lib/whatsapp'
import { normalizeNavCategorias } from '@/components/catalog/CatalogMegaMenu'
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

  const isMayoreo = catalogType === 'mayoreo'
  const homeHref = catalogPath(catalogType, '/')
  const productosHref = catalogPath(catalogType, '/productos')
  const roots = useMemo(() => normalizeNavCategorias(categorias), [categorias])
  const onProductos =
    pathname === productosHref || pathname.startsWith(`${productosHref}/`)
  const isHome =
    pathname === homeHref ||
    pathname === `${homeHref}/` ||
    pathname === '/' ||
    (isMayoreo &&
      (pathname === '/mayorista' ||
        pathname === '/mayorista/' ||
        pathname === '/mayoreo' ||
        pathname === '/mayoreo/'))

  const whatsappUrl = buildWhatsAppUrl(
    resolveWhatsAppNumero(),
    mensajeConsultaWhatsApp('flotante', catalogType),
  )

  const goToCategoria = (slug: string) => {
    onClose()
    signalCatalogNavigating()
    setActiveCategoria(slug)
    const href = slug
      ? catalogCategoriaPath(catalogType, slug)
      : productosHref
    if (onProductos) {
      signalCatalogCategoria(slug)
      router.replace(href, { scroll: false })
      return
    }
    router.push(href)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    setActiveCategoria(
      new URLSearchParams(window.location.search).get('categoria') || '',
    )
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
          {/* Bloque 1 — navegación */}
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-faint)]">
            Navegar
          </p>
          <Link
            href={homeHref}
            onClick={onClose}
            className={linkClass(isNavActive(homeHref) && !activeCategoria && !onProductos)}
          >
            Inicio
          </Link>
          <Link
            href={productosHref}
            onClick={onClose}
            className={linkClass(onProductos && !activeCategoria)}
          >
            Catálogo
          </Link>
          <Link
            href={isHome ? '#ofertas' : `${homeHref}#ofertas`}
            onClick={onClose}
            className={linkClass(false)}
          >
            Ofertas
          </Link>
          <Link
            href={isHome ? '#novedades' : `${homeHref}#novedades`}
            onClick={onClose}
            className={linkClass(false)}
          >
            Novedades
          </Link>

          {/* Bloque 2 — categorías */}
          {roots.length > 0 && (
            <>
              <div className="mb-2 mt-6 flex items-center justify-between gap-2 px-3">
                <p className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-faint)]">
                  Categorías
                </p>
                <button
                  type="button"
                  onClick={() => goToCategoria('')}
                  className="text-[11px] font-bold text-[var(--accent-primary)]"
                >
                  Ver todo
                </button>
              </div>
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
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-muted)]">
                          {cat.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cat.imagen_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Sparkles
                              size={12}
                              className="text-[var(--accent-primary)]"
                            />
                          )}
                        </span>
                        <span className="truncate">{cat.nombre}</span>
                      </span>
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
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/80 ring-1 ring-[var(--border)]">
                          {cat.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cat.imagen_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Sparkles
                              size={12}
                              className="text-[var(--accent-primary)]"
                            />
                          )}
                        </span>
                        <span className="truncate">{cat.nombre}</span>
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.75}
                        className={`shrink-0 transition-transform duration-200 ${
                          isExpanded
                            ? 'rotate-90 text-[var(--accent-primary)]'
                            : 'text-[var(--text-subtle)]'
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

        {/* Footer CTAs */}
        <div className="shrink-0 space-y-2 border-t border-[var(--border)] px-4 py-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[13px] font-bold text-white"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          {isMayoreo ? (
            <Link
              href="/"
              onClick={onClose}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-4 text-[12px] font-bold text-[var(--accent-deep)]"
            >
              <Store size={14} />
              Ir a tienda detal
            </Link>
          ) : null}
        </div>
      </div>
    </MobileDrawer>
  )
}
