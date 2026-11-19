'use client'

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  children: ReactNode
  /** Width of each item (Tailwind classes). Every item has the same width. */
  itemClassName?: string
  gapClassName?: string
  className?: string
  /** Accessible name of the carousel, e.g. "Productos destacados". */
  label?: string
  /** Vertical position of the arrows (Tailwind top-*), centred on the cards by default. */
  arrowTopClassName?: string
}

/**
 * One-row carousel for cards, on phones and desktop.
 * - Native scrolling with snap: a swipe or a trackpad always stops on a whole card.
 * - Arrows move by the number of cards that fit on screen and always land
 *   exactly on a card edge (no half-cut card after clicking).
 * - Vertical swipes that start on the carousel still scroll the page (touch-manipulation).
 * - Keyboard: ← / → when the carousel has focus. Honors "reduce motion".
 */
export default function HorizontalCarousel({
  children,
  itemClassName = 'w-[72vw] sm:w-[260px]',
  gapClassName = 'gap-3',
  className = '',
  label,
  arrowTopClassName = 'top-[42%]',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    el.addEventListener('scroll', updateScrollState, { passive: true })
    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', updateScrollState)
    }
  }, [updateScrollState, children])

  const scroll = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const step = first.offsetWidth + gap
    // Move by every card that is fully visible (at least one), then align to a card edge.
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step))
    const currentIndex = Math.round(el.scrollLeft / step)
    const maxScroll = el.scrollWidth - el.clientWidth
    const target = Math.min(maxScroll, Math.max(0, (currentIndex + direction * perPage) * step))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scroll(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scroll(-1)
    }
  }

  const items = Children.toArray(children)

  const arrowClass = `absolute ${arrowTopClassName} z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-deep)] disabled:pointer-events-none disabled:opacity-0`

  return (
    <div className={`relative ${className}`} role="region" aria-roledescription="carrusel" aria-label={label}>
      <button
        type="button"
        onClick={() => scroll(-1)}
        disabled={!canScrollLeft}
        aria-label="Ver anteriores"
        className={`${arrowClass} left-1 sm:left-0 sm:-translate-x-1/2`}
      >
        <ChevronLeft size={18} aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => scroll(1)}
        disabled={!canScrollRight}
        aria-label="Ver siguientes"
        className={`${arrowClass} right-1 sm:right-0 sm:translate-x-1/2`}
      >
        <ChevronRight size={18} aria-hidden />
      </button>

      {/*
        touch-manipulation (not touch-pan-x): a vertical swipe that starts on the
        carousel must still scroll the page on phones.
        snap-x snap-mandatory + snap-start: every swipe ends on a whole card.
        py-2: room for card shadows and hover lift so they are not clipped.
      */}
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`flex ${gapClassName} snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-manipulation scrollbar-hide py-2 focus-visible:outline-none`}
      >
        {items.map((child, i) => (
          <div
            key={isValidElement(child) && child.key != null ? child.key : i}
            className={`shrink-0 snap-start ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
