'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Resetea el scroll al inicio en cada cambio de ruta y desactiva la
 * restauración automática del navegador para que al volver a una página
 * siempre se muestre desde arriba.
 */
export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
