'use client'

import ProductosCarousel from '@/components/catalog/ProductosCarousel'
import { Producto } from '@/types'
import { catalogPath, type CatalogType } from '@/lib/catalog'

export default function ProductosOfertas({
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
      eyebrow="Ahorra"
      title={
        <>
          Ofertas <span className="catalog-section-accent">del momento</span>
        </>
      }
      description="Descuentos activos para consentirte 🎀"
      verMasHref={catalogPath(catalogType, '/productos')}
      verMasLabel="Ver más"
      sectionId="ofertas"
      muted
    />
  )
}
