'use client'

import ProductosCarousel from '@/components/catalog/ProductosCarousel'
import { Producto } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'

export default function ProductosDestacados({
  productos,
  catalogType = 'detal',
}: {
  productos: Producto[]
  catalogType?: CatalogType
}) {
  return (
    <ProductosCarousel
      productos={productos}
      catalogType={catalogType}
      eyebrow="Selección"
      title={
        <>
          Productos <span className="catalog-section-accent">destacados</span>
        </>
      }
      description="Piezas que enamoran: lo más pedido de la tienda ✨"
      verMasHref={catalogPath(catalogType, '/productos')}
      verMasLabel="Ver catálogo"
    />
  )
}
