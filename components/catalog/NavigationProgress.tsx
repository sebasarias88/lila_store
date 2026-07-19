'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Barra de progreso superior durante navegaciones (Links / cambios de URL).
 * Da feedback inmediato cuando la página se queda "tieza" esperando el RSC.
 */
function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    if (tickTimer.current) {
      clearInterval(tickTimer.current)
      tickTimer.current = null
    }
  }

  const start = () => {
    clearTimers()
    setVisible(true)
    setProgress(12)
    tickTimer.current = setInterval(() => {
      setProgress(p => (p >= 88 ? p : p + Math.random() * 10 + 2))
    }, 280)
  }

  const finish = () => {
    clearTimers()
    setProgress(100)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 220)
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        const next = `${url.pathname}${url.search}`
        const current = `${window.location.pathname}${window.location.search}`
        if (next === current) return
        start()
      } catch {
        /* ignore */
      }
    }

    const onCatalogNav = () => start()

    document.addEventListener('click', onClick, true)
    window.addEventListener('vm:catalog-navigating', onCatalogNav)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('vm:catalog-navigating', onCatalogNav)
      clearTimers()
    }
  }, [])

  // Cuando la ruta/search cambia, la navegación terminó
  useEffect(() => {
    if (!visible) return
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al completar navegación
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Cargando"
    >
      <div
        className="h-full bg-[var(--gold)] shadow-[0_0_10px_color-mix(in_srgb,var(--gold)_55%,transparent)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}

export function signalCatalogNavigating() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('vm:catalog-navigating'))
}

export function signalCatalogCategoria(slug: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('vm:catalog-categoria', { detail: { slug } }),
  )
}
