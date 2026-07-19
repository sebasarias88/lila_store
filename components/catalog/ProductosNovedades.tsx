'use client'

import ProductosCarousel from '@/components/catalog/ProductosCarousel'
import { Producto } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'

export default function ProductosNovedades({
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
      eyebrow="Recién llegados"
      title={
        <>
          Nuevos <span className="catalog-section-accent">en catálogo</span>
        </>
      }
      description="Lo último en belleza para explorar 💕"
      verMasHref={catalogPath(catalogType, '/productos')}
      verMasLabel="Ver más"
      sectionId="novedades"
    />
  )
}
