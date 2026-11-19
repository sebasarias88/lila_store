'use client'

import StoreErrorScreen from '@/components/catalog/StoreErrorScreen'

export default function CatalogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StoreErrorScreen
      {...props}
      homeHref="/"
      message="No pudimos cargar el contenido. Revisa tu conexión a internet e inténtalo de nuevo."
    />
  )
}
