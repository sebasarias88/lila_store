'use client'

import { useEffect, useRef, useState } from 'react'

const INTERACTIVE =
  'a,button,[role="button"],input,textarea,select,label,summary,[data-cursor="pointer"],.cursor-pointer'
const TEXT_FIELD =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]),textarea,[contenteditable="true"]'

/** Flecha tipo mouse + corazoncito */
function ArrowHeartIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path
        d="M6.2 4.4c-.55-.3-1.15.2-1 0.8l3.4 19.1c.15.8 1.2 1 1.7.35l4.55-5.9 2.55 6.55c.2.5.8.7 1.25.4l2.05-1.35c.45-.3.55-.9.25-1.3L16.5 14.2l7.35-1.55c.8-.15.95-1.2.25-1.6L6.2 4.4Z"
        fill="currentColor"
      />
      <path
        d="M22.8 20.2c0-1.35 1-2.25 2.15-2.25.7 0 1.3.35 1.55.9.25-.55.85-.9 1.55-.9 1.15 0 2.15.9 2.15 2.25 0 2.55-3.7 4.7-3.7 4.7s-3.7-2.15-3.7-4.7Z"
        fill="#E8A0C8"
      />
    </svg>
  )
}

/**
 * Cursor cute global (catálogo detal, mayorista y admin).
 * Solo desktop con puntero fino; respeta reduced-motion.
 */
export default function CuteCursor() {
  const [enabled, setEnabled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const trailRef = useRef<HTMLSpanElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const trail = useRef({ x: -100, y: -100 })
  const hovering = useRef(false)
  const textMode = useRef(false)
  const visible = useRef(false)
  const raf = useRef(0)

  useEffect(() => {
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = () => {
      const ok = mqFine.matches && !mqMotion.matches
      setEnabled(ok)
      document.documentElement.toggleAttribute('data-cute-cursor', ok)
    }

    sync()
    mqFine.addEventListener('change', sync)
    mqMotion.addEventListener('change', sync)
    return () => {
      mqFine.removeEventListener('change', sync)
      mqMotion.removeEventListener('change', sync)
      document.documentElement.removeAttribute('data-cute-cursor')
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      const ease = 0.22
      trail.current.x += (pos.current.x - trail.current.x) * ease
      trail.current.y += (pos.current.y - trail.current.y) * ease

      // Hotspot cerca de la punta de la flecha
      if (tipRef.current) {
        tipRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-12%, -8%)`
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${trail.current.x}px, ${trail.current.y}px, 0) translate(-12%, -8%)`
      }
      if (rootRef.current) {
        rootRef.current.dataset.hover = hovering.current ? 'true' : 'false'
        rootRef.current.dataset.text = textMode.current ? 'true' : 'false'
        rootRef.current.dataset.visible = visible.current ? 'true' : 'false'
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
      visible.current = true

      const target = e.target as Element | null
      if (!target || typeof target.closest !== 'function') {
        hovering.current = false
        textMode.current = false
        return
      }
      textMode.current = Boolean(target.closest(TEXT_FIELD))
      hovering.current = !textMode.current && Boolean(target.closest(INTERACTIVE))
    }

    const onLeave = () => {
      visible.current = false
      hovering.current = false
      textMode.current = false
    }

    const onDown = () => {
      if (rootRef.current) rootRef.current.dataset.down = 'true'
    }
    const onUp = () => {
      if (rootRef.current) rootRef.current.dataset.down = 'false'
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={rootRef}
      className="cute-cursor"
      aria-hidden
      data-visible="false"
      data-hover="false"
      data-text="false"
      data-down="false"
    >
      <span ref={trailRef} className="cute-cursor__trail">
        <ArrowHeartIcon size={22} />
      </span>
      <span ref={tipRef} className="cute-cursor__tip">
        <ArrowHeartIcon size={28} />
      </span>
    </div>
  )
}
