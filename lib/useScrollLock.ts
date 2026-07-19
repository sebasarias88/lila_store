'use client'

import { useEffect } from 'react'

type LenisLike = { stop: () => void; start: () => void }

function getLenis(): LenisLike | undefined {
  return (window as Window & { __lenis?: LenisLike }).__lenis
}

/** Bloquea el scroll de la página (compatible con Lenis) mientras un overlay está abierto */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const lenis = getLenis()
    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyPosition = body.style.position
    const prevBodyTop = body.style.top
    const prevBodyWidth = body.style.width

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    lenis?.stop()

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.position = prevBodyPosition
      body.style.top = prevBodyTop
      body.style.width = prevBodyWidth
      window.scrollTo(0, scrollY)
      lenis?.start()
    }
  }, [locked])
}
