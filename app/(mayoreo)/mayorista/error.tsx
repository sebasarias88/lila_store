'use client'

import StoreErrorScreen from '@/components/catalog/StoreErrorScreen'

export default function MayoreoError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StoreErrorScreen
      {...props}
      homeHref="/mayorista"
      message="No pudimos cargar el catálogo mayorista. Revisa tu conexión a internet e inténtalo de nuevo."
    />
  )
}
