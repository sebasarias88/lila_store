'use client'

import { useEffect, useRef, useState } from 'react'

const INTERACTIVE =
  'a,button,[role="button"],input,textarea,select,label,summary,[data-cursor="pointer"],.cursor-pointer'
const TEXT_FIELD =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]),textarea,[contenteditable="true"]'

/** Moñito / lazo cute */
function BowIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 32" width={size} height={size * 0.8} aria-hidden>
      <path
        d="M19.2 15.2C14.2 8.4 8.2 6.6 5.4 9.2c-2.8 2.6-1.2 8.2 4.2 12.2 3.4 2.5 7.2 2.6 9.6-.2"
        fill="currentColor"
      />
      <path
        d="M20.8 15.2C25.8 8.4 31.8 6.6 34.6 9.2c2.8 2.6 1.2 8.2-4.2 12.2-3.4 2.5-7.2 2.6-9.6-.2"
        fill="currentColor"
      />
      <path
        d="M18.6 15C15.2 10.4 11 9.2 9.2 10.8c-1.8 1.6-.7 5.2 2.9 7.8 2.2 1.6 4.7 1.7 6.5-.3"
        fill="#E8A0C8"
        opacity="0.85"
      />
      <path
        d="M21.4 15C24.8 10.4 29 9.2 30.8 10.8c1.8 1.6.7 5.2-2.9 7.8-2.2 1.6-4.7 1.7-6.5-.3"
        fill="#E8A0C8"
        opacity="0.85"
      />
      <ellipse cx="20" cy="15.6" rx="3.4" ry="3.8" fill="currentColor" />
      <ellipse cx="20" cy="15.4" rx="1.7" ry="1.9" fill="#F9F6FF" opacity="0.55" />
      <path
        d="M17.6 18.2 12.8 28.4c-.35.75.35 1.5 1.1 1.2l5.4-2.2 1.2-6.8"
        fill="currentColor"
      />
      <path
        d="M22.4 18.2 27.2 28.4c.35.75-.35 1.5-1.1 1.2l-5.4-2.2-1.2-6.8"
        fill="currentColor"
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
      const ease = 0.2
      trail.current.x += (pos.current.x - trail.current.x) * ease
      trail.current.y += (pos.current.y - trail.current.y) * ease

      if (tipRef.current) {
        tipRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -42%)`
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${trail.current.x}px, ${trail.current.y}px, 0) translate(-50%, -42%)`
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
        <BowIcon size={22} />
      </span>
      <span ref={tipRef} className="cute-cursor__tip">
        <BowIcon size={28} />
      </span>
    </div>
  )
}
