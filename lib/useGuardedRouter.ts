'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

type NavOptions = { scroll?: boolean }

/**
 * Indica si la navegación debe bloquearse por falta de conexión.
 * Además avisa al indicador global (ConnectionStatus) para mostrar el aviso.
 */
function isBlockedOffline(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    window.dispatchEvent(new CustomEvent('offline-nav-blocked'))
    return true
  }
  return false
}

/**
 * Envoltura de `useRouter` que evita navegar cuando no hay conexión.
 * Sin internet, una navegación (Link o push) dispara un fetch RSC que falla
 * y Next hace un "hard navigation" → pantalla de error del navegador.
 * Aquí lo prevenimos y mantenemos la UI actual.
 */
export function useGuardedRouter() {
  const router = useRouter()

  return useMemo(
    () => ({
      push: (href: string, options?: NavOptions) => {
        if (isBlockedOffline()) return
        router.push(href, options)
      },
      replace: (href: string, options?: NavOptions) => {
        if (isBlockedOffline()) return
        router.replace(href, options)
      },
      back: () => {
        if (isBlockedOffline()) return
        router.back()
      },
      refresh: () => router.refresh(),
    }),
    [router],
  )
}
