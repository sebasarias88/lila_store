'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCarrito } from '@/lib/store'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { ChevronDown, Sparkles } from 'lucide-react'
import CartDrawer from '@/components/catalog/CartDrawer'
import LuxuryCartIcon from '@/components/catalog/LuxuryCartIcon'
import DesktopNavSearch from '@/components/catalog/DesktopNavSearch'
import MobileHeader from '@/components/catalog/mobile/MobileHeader'

type NavbarProps = {
  nombreNegocio: string
  categorias: Categoria[]
  catalogType?: CatalogType
  hasAnnouncement?: boolean
}

function getActiveSubs(cat: Categoria): Categoria[] {
  return (cat.subcategorias || [])
    .filter(s => s.activa !== false)
    .sort((a, b) => a.orden - b.orden)
}

export default function Navbar({
  nombreNegocio,
  categorias,
  catalogType = 'detal',
  hasAnnouncement,
}: NavbarProps) {
  const pathname = usePathname()
  const cantidad = useCarrito(s => s.cantidad())
  const [scrolled, setScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [catsOpen, setCatsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [heroOverImage, setHeroOverImage] = useState(false)
  const [heroLayout, setHeroLayout] = useState('')
  const catsRef = useRef<HTMLDivElement>(null)

  const isMayoreo = catalogType === 'mayoreo'
  const offsetTop = hasAnnouncement ?? isMayoreo
  const homeHref = catalogPath(catalogType, '/')
  const productosHref = catalogPath(catalogType, '/productos')
  const isHome = isHomePath(pathname, homeHref, isMayoreo)
  const ofertasHref = isHome ? '#ofertas' : `${homeHref}#ofertas`
  const novedadesHref = isHome ? '#novedades' : `${homeHref}#novedades`

  const overHero = isHome && !scrolled && heroOverImage
  const solidOverHero =
    isHome && !scrolled && (heroLayout === 'image-only' || heroLayout === 'split')

  const isNavActive = (href: string) => {
    if (href === homeHref) {
      return pathname === href || pathname === `${href}/` || pathname === '/'
    }
    if (href === productosHref) {
      return (
        (pathname === productosHref || pathname.startsWith(`${productosHref}/`)) &&
        !pathname.includes('?')
      )
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const onProductos =
    pathname === productosHref || pathname.startsWith(`${productosHref}/`)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const syncHero = () => {
      setHeroOverImage(
        document.documentElement.getAttribute('data-hero-has-image') === 'true',
      )
      setHeroLayout(
        document.documentElement.getAttribute('data-hero-layout') || '',
      )
    }
    syncHero()
    const obs = new MutationObserver(syncHero)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-hero-has-image', 'data-hero-layout'],
    })
    return () => obs.disconnect()
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setCatsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!catsOpen) return
    const onPointer = (e: PointerEvent) => {
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) {
        setCatsOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [catsOpen])

  const linkBase = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors duration-200 ${
      active
        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
        : overHero
          ? 'text-white/90 hover:bg-white/15 hover:text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]'
    }`

  const rootCats = categorias.filter(c => !c.padre_id).slice(0, 8)

  return (
    <>
      <div className="md:hidden">
        <MobileHeader
          nombreNegocio={nombreNegocio}
          categorias={categorias}
          catalogType={catalogType}
          scrolled={scrolled}
          hasAnnouncement={offsetTop}
        />
      </div>

      <motion.header
        className={`fixed left-0 right-0 z-30 hidden transition-all duration-400 md:block ${
          offsetTop ? 'top-9' : 'top-0'
        } ${
          scrolled || solidOverHero
            ? 'border-b border-[var(--border)] bg-[var(--navbar-bg)] backdrop-blur-md shadow-[var(--shadow-soft)]'
            : overHero
              ? 'bg-gradient-to-b from-[rgba(156,75,124,0.45)] via-[rgba(156,75,124,0.18)] to-transparent'
              : 'bg-transparent'
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href={homeHref} className="min-w-0 shrink-0">
              <span
                className={`brand-wordmark block truncate text-[20px] transition-colors ${
                  overHero ? 'text-white' : 'text-[var(--accent-deep)]'
                }`}
              >
                {nombreNegocio}
              </span>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              <Link href={homeHref} className={linkBase(isNavActive(homeHref) && !onProductos)}>
                Inicio
              </Link>

              <div ref={catsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCatsOpen(o => !o)}
                  aria-expanded={catsOpen}
                  className={`inline-flex items-center gap-1 ${linkBase(catsOpen || onProductos)}`}
                >
                  Categorías
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${catsOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {catsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 top-[calc(100%+0.65rem)] z-50 w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-dropdown)]"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <p className="text-[12px] font-bold text-[var(--accent-deep)]">
                          Explorar por categoría
                        </p>
                        <Link
                          href={productosHref}
                          onClick={() => setCatsOpen(false)}
                          className="text-[12px] font-bold text-[var(--accent-primary)] hover:underline"
                        >
                          Ver todo →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {rootCats.map(cat => {
                          const subs = getActiveSubs(cat).slice(0, 3)
                          return (
                            <div
                              key={cat.id}
                              className="rounded-[16px] bg-[var(--bg-muted)]/70 p-2.5"
                            >
                              <Link
                                href={`${productosHref}?categoria=${encodeURIComponent(cat.slug)}`}
                                onClick={() => setCatsOpen(false)}
                                className="flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-[13px] font-bold text-[var(--text-primary)] transition-colors hover:bg-white hover:text-[var(--accent-deep)]"
                              >
                                <Sparkles size={13} className="text-[var(--accent-primary)]" />
                                {cat.nombre}
                              </Link>
                              {subs.length > 0 && (
                                <div className="mt-1 space-y-0.5 pl-2">
                                  {subs.map(sub => (
                                    <Link
                                      key={sub.id}
                                      href={`${productosHref}?categoria=${encodeURIComponent(sub.slug)}`}
                                      onClick={() => setCatsOpen(false)}
                                      className="block rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white hover:text-[var(--accent-deep)]"
                                    >
                                      {sub.nombre}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href={productosHref} className={linkBase(onProductos)}>
                Catálogo
              </Link>
              <Link href={ofertasHref} className={linkBase(false)}>
                Ofertas
              </Link>
              <Link href={novedadesHref} className={linkBase(false)}>
                Novedades
              </Link>
            </nav>

            {/* Compact nav for md */}
            <nav className="hidden items-center gap-1 md:flex lg:hidden">
              <Link href={homeHref} className={linkBase(isNavActive(homeHref) && !onProductos)}>
                Inicio
              </Link>
              <Link href={productosHref} className={linkBase(onProductos)}>
                Catálogo
              </Link>
              <Link href={ofertasHref} className={linkBase(false)}>
                Ofertas
              </Link>
            </nav>

            <div className="flex shrink-0 items-center gap-2.5">
              <DesktopNavSearch
                catalogType={catalogType}
                categorias={categorias}
                light={overHero}
              />

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCartOpen(true)}
                aria-label={`Carrito${mounted && cantidad > 0 ? `, ${cantidad} artículos` : ''}`}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  overHero
                    ? 'border-white/40 bg-white/15 text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-[var(--accent-deep)]'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent-deep)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white'
                }`}
              >
                <LuxuryCartIcon size={16} />
                {mounted && cantidad > 0 && (
                  <span
                    className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-deep)] px-1 text-[10px] font-bold tabular-nums text-white"
                    aria-hidden
                  >
                    {cantidad > 99 ? '99+' : cantidad}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="hidden md:block">
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          catalogType={catalogType}
        />
      </div>
    </>
  )
}

function isHomePath(pathname: string, homeHref: string, isMayoreo: boolean) {
  return (
    pathname === homeHref ||
    pathname === `${homeHref}/` ||
    pathname === '/' ||
    (isMayoreo &&
      (pathname === '/mayorista' ||
        pathname === '/mayorista/' ||
        pathname === '/mayoreo' ||
        pathname === '/mayoreo/'))
  )
}
