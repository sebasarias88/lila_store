'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCarrito } from '@/lib/store'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { ChevronDown } from 'lucide-react'
import CartDrawer from '@/components/catalog/CartDrawer'
import LuxuryCartIcon from '@/components/catalog/LuxuryCartIcon'
import DesktopNavSearch from '@/components/catalog/DesktopNavSearch'
import CatalogMegaMenu from '@/components/catalog/CatalogMegaMenu'
import MobileHeader from '@/components/catalog/mobile/MobileHeader'

type NavbarProps = {
  nombreNegocio: string
  categorias: Categoria[]
  catalogType?: CatalogType
  hasAnnouncement?: boolean
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
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMayoreo = catalogType === 'mayoreo'
  const offsetTop = hasAnnouncement ?? isMayoreo
  const homeHref = catalogPath(catalogType, '/')
  const productosHref = catalogPath(catalogType, '/productos')
  const isHome = isHomePath(pathname, homeHref, isMayoreo)
  const ofertasHref = isHome ? '#ofertas' : `${homeHref}#ofertas`
  const novedadesHref = isHome ? '#novedades' : `${homeHref}#novedades`

  const solidOverHero =
    isHome && !scrolled && (heroLayout === 'image-only' || heroLayout === 'split')
  const overHero = isHome && !scrolled && heroOverImage && !solidOverHero

  const onProductos =
    pathname === productosHref || pathname.startsWith(`${productosHref}/`)

  const isNavActive = (href: string) => {
    if (href === homeHref) {
      return pathname === href || pathname === `${homeHref}/` || pathname === '/'
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const closeCats = useCallback(() => setCatsOpen(false), [])

  const openCatsSoon = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setCatsOpen(true)
  }

  const closeCatsSoon = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setCatsOpen(false), 160)
  }

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

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
  }, [])

  const linkBase = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors duration-200 ${
      active
        ? 'bg-[var(--bg-muted)] text-[var(--accent-deep)]'
        : overHero
          ? 'text-white/90 hover:bg-white/15 hover:text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-deep)]'
    }`

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
              ? 'bg-gradient-to-b from-[rgba(110,79,168,0.45)] via-[rgba(110,79,168,0.18)] to-transparent'
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

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1">
              <Link
                href={homeHref}
                className={linkBase(isNavActive(homeHref) && !onProductos)}
              >
                Inicio
              </Link>

              <div
                ref={catsRef}
                className="relative"
                onMouseEnter={openCatsSoon}
                onMouseLeave={closeCatsSoon}
              >
                <button
                  type="button"
                  onClick={() => setCatsOpen(o => !o)}
                  aria-expanded={catsOpen}
                  aria-haspopup="menu"
                  className={`inline-flex items-center gap-1 ${linkBase(
                    catsOpen || onProductos,
                  )}`}
                >
                  Catálogo
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${catsOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <CatalogMegaMenu
                  open={catsOpen}
                  onClose={closeCats}
                  categorias={categorias}
                  productosHref={productosHref}
                />
              </div>

              <Link href={ofertasHref} className={linkBase(false)}>
                Ofertas
              </Link>
              <Link href={novedadesHref} className={linkBase(false)}>
                Novedades
              </Link>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {isMayoreo ? (
                <Link
                  href="/"
                  className={`hidden rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors lg:inline-flex ${
                    overHero
                      ? 'border border-white/35 bg-white/10 text-white hover:bg-white hover:text-[var(--accent-deep)]'
                      : 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent-deep)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  Tienda detal
                </Link>
              ) : null}

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
