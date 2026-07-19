'use client'

import { ReactNode } from 'react'
import { Producto } from '@/types'
import { type CatalogType } from '@/lib/catalog'
import ProductCard from '@/components/catalog/ProductCard'
import ProductCardMobile from '@/components/catalog/mobile/ProductCardMobile'

type ResponsiveProductCardProps = {
  producto: Producto
  catalogType?: CatalogType
}

/** Muestra card táctil en móvil y card desktop sin cambios desde md */
export default function ResponsiveProductCard({
  producto,
  catalogType = 'detal',
}: ResponsiveProductCardProps) {
  return (
    <>
      <div className="h-full md:hidden">
        <ProductCardMobile producto={producto} catalogType={catalogType} />
      </div>
      <div className="hidden h-full md:block">
        <ProductCard producto={producto} catalogType={catalogType} />
      </div>
    </>
  )
}

export function ProductGridMobile({ children }: { children: ReactNode }) {
  return (
    <div className="mobile-product-grid grid grid-cols-2 gap-2.5 sm:gap-3">
      {children}
    </div>
  )
}
