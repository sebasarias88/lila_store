'use client'

import { motion } from 'framer-motion'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <motion.div
      className={`rounded-[2px] bg-[var(--bg-muted)] ${className}`}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// Skeleton de card de producto — catálogo
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col bg-[var(--bg-card)]">
      <Skeleton className="aspect-[3/4] w-full flex-shrink-0" />
      <div className="flex flex-1 flex-col px-4 py-4 min-h-[5.5rem]">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-auto h-4 w-24 pt-4" />
      </div>
    </div>
  )
}

// Skeleton de fila de tabla — admin
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-[rgba(184,146,42,0.14)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-3 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

// Skeleton de detalle de producto
export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-px w-full mt-4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    </div>
  )
}
