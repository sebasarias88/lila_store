'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Menu, Search } from 'lucide-react'
import { useCarrito } from '@/lib/store'
import { Categoria } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import LuxuryCartIcon from '@/components/catalog/LuxuryCartIcon'
import MobileNavDrawer from '@/components/catalog/mobile/MobileNavDrawer'
import MobileSearchOverlay from '@/components/catalog/mobile/MobileSearchOverlay'
import MobileCartSheet from '@/components/catalog/mobile/MobileCartSheet'
import MobileFloatingCart from '@/components/catalog/mobile/MobileFloatingCart'

type MobileHeaderProps = {
  nombreNegocio: string
  categorias: Categoria[]
  catalogType?: CatalogType
  scrolled?: boolean
  hasAnnouncement?: boolean
}

export default function MobileHeader({
  nombreNegocio,
  categorias,
  catalogType = 'detal',
  scrolled = false,
  hasAnnouncement,
}: MobileHeaderProps) {
  const cantidad = useCarrito(s => s.cantidad())
  const [mounted, setMounted] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const isMayoreo = catalogType === 'mayoreo'
  const offsetTop = hasAnnouncement ?? isMayoreo
  const homeHref = catalogPath(catalogType, '/')

  useEffect(() => {
    setMounted(true)
  }, [])

  const openCart = () => {
    setCartOpen(true)
  }

  return (
    <>
      <motion.header
        className={`fixed left-0 right-0 z-30 transition-all duration-300 ${
          offsetTop ? 'top-9' : 'top-0'
        } ${
          scrolled
            ? 'border-b border-[var(--border)] bg-[var(--navbar-bg)]/98 backdrop-blur-lg shadow-[var(--shadow-soft)]'
            : 'bg-[var(--navbar-bg)]/88 backdrop-blur-md'
        } mobile-safe-top`}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="mobile-catalog-icon-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-[var(--text-secondary)] active:border-[var(--border)] active:bg-[var(--bg-muted)] active:text-[var(--accent-deep)]"
            aria-label="Abrir menú"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          <Link href={homeHref} className="min-w-0 flex-1 px-1 text-center">
            <span className="brand-wordmark block truncate text-[16px] text-[var(--accent-deep)]">
              {nombreNegocio}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mobile-catalog-icon-btn flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--bg-muted)] active:text-[var(--gold)]"
              aria-label="Buscar productos"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="mobile-catalog-icon-btn relative flex h-11 w-11 items-center justify-center rounded-lg text-[var(--gold)] active:bg-[var(--gold-muted)]"
              aria-label={`Carrito${mounted && cantidad > 0 ? `, ${cantidad} artículos` : ''}`}
            >
              <LuxuryCartIcon size={20} />
              {mounted && cantidad > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[9px] font-bold leading-none text-[var(--text-on-gold)]"
                  aria-hidden
                >
                  {cantidad > 99 ? '99+' : cantidad}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <MobileNavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        nombreNegocio={nombreNegocio}
        categorias={categorias}
        catalogType={catalogType}
      />

      <MobileSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        catalogType={catalogType}
        categorias={categorias}
      />

      <MobileCartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        catalogType={catalogType}
      />

      <MobileFloatingCart catalogType={catalogType} onOpenCart={openCart} />
    </>
  )
}
