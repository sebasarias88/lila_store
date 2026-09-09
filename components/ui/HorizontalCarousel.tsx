'use client'

import { Children, ReactNode, useCallback, useEffect, useRef, useState, isValidElement } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  children: ReactNode
  itemClassName?: string
  gapClassName?: string
  className?: string
}

export default function HorizontalCarousel({
  children,
  itemClassName = 'w-[72vw] sm:w-[260px]',
  gapClassName = 'gap-3',
  className = '',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(maxScroll > 8 && el.scrollLeft < maxScroll - 8)
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

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction === 'left' ? -el.clientWidth * 0.82 : el.clientWidth * 0.82,
      behavior: 'smooth',
    })
  }

  const items = Children.toArray(children)

  const arrowClass =
    'absolute top-[42%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--accent-deep)] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white disabled:pointer-events-none disabled:opacity-0 sm:opacity-0 sm:group-hover/carousel:opacity-100'

  return (
    <div className={`group/carousel relative ${className}`}>
      <button
        type="button"
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Anterior"
        className={`${arrowClass} left-1 sm:left-0 sm:-translate-x-1/2`}
      >
        <ChevronLeft size={18} />
      </button>

      <button
        type="button"
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Siguiente"
        className={`${arrowClass} right-1 sm:right-0 sm:translate-x-1/2`}
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scrollRef}
        className={`flex ${gapClassName} overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x scrollbar-hide pb-1`}
      >
        {items.map((child, i) => (
          <div
            key={isValidElement(child) && child.key != null ? child.key : i}
            className={`shrink-0 ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
