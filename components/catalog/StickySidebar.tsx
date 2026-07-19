'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type StickySidebarProps = {
  children: ReactNode
  className?: string
  top?: number
}

/**
 * Sidebar que acompaña el scroll. Usa position:fixed calculada para
 * funcionar con Lenis y sin depender de overflow/transform de ancestros.
 */
export default function StickySidebar({
  children,
  className = '',
  top = 96,
}: StickySidebarProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    const slot = slotRef.current
    const panel = panelRef.current
    if (!slot || !panel) return

    const mq = window.matchMedia('(min-width: 1024px)')

    const update = () => {
      if (!mq.matches) {
        setPanelStyle({})
        return
      }

      const slotRect = slot.getBoundingClientRect()
      const panelHeight = panel.offsetHeight
      const scrollY = window.scrollY
      const slotTop = scrollY + slotRect.top
      const slotHeight = slot.offsetHeight
      const pinStart = slotTop - top
      const pinEnd = slotTop + slotHeight - panelHeight - top

      if (scrollY <= pinStart) {
        setPanelStyle({ position: 'relative', width: '100%' })
      } else if (scrollY >= pinEnd) {
        setPanelStyle({
          position: 'absolute',
          top: slotHeight - panelHeight,
          left: 0,
          width: '100%',
        })
      } else {
        setPanelStyle({
          position: 'fixed',
          top,
          left: slotRect.left,
          width: slotRect.width,
          zIndex: 20,
        })
      }
    }

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('lenis-scroll', schedule)
    mq.addEventListener('change', schedule)

    const ro = new ResizeObserver(schedule)
    ro.observe(slot)
    ro.observe(panel)

    schedule()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('lenis-scroll', schedule)
      mq.removeEventListener('change', schedule)
      ro.disconnect()
    }
  }, [top, children])

  return (
    <div ref={slotRef} className={`relative min-h-full ${className}`}>
      <div ref={panelRef} style={panelStyle}>
        {children}
      </div>
    </div>
  )
}
