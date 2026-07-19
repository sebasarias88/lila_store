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

  return (
    <div className={`group/carousel relative ${className}`}>
      <button
        type="button"
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Anterior"
        className="absolute left-1 top-[42%] z-20 flex -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(201,168,76,0.42)] bg-[rgba(10,10,10,0.95)] shadow-md p-2 text-[rgba(240,235,228,0.9)] backdrop-blur-sm transition-all hover:border-[rgba(201,168,76,0.67)] hover:text-[#C9A84C] disabled:pointer-events-none disabled:opacity-0 sm:left-0 sm:-translate-x-1/2 sm:opacity-0 sm:group-hover/carousel:opacity-100"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        type="button"
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Siguiente"
        className="absolute right-1 top-[42%] z-20 flex -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(201,168,76,0.42)] bg-[rgba(10,10,10,0.95)] shadow-md p-2 text-[rgba(240,235,228,0.9)] backdrop-blur-sm transition-all hover:border-[rgba(201,168,76,0.67)] hover:text-[#C9A84C] disabled:pointer-events-none disabled:opacity-0 sm:right-0 sm:translate-x-1/2 sm:opacity-0 sm:group-hover/carousel:opacity-100"
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scrollRef}
        className={`flex ${gapClassName} overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide pb-1`}
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
