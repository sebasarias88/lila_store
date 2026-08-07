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
      eyebrow="Ofertas cute 🎀"
      title={
        <>
          Ofertas <span className="catalog-section-accent">del momento</span>
        </>
      }
      description="Descuentos preciosos para consentirte ✨"
      verMasHref={catalogPath(catalogType, '/productos')}
      verMasLabel="Ver ofertas"
      sectionId="ofertas"
      layout="carousel"
    />
  )
}
