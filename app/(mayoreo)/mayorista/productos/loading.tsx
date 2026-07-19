import { Skeleton, ProductCardSkeleton } from '@/components/ui/Skeleton'

export default function MayoreoProductosLoading() {
  return (
    <div className="relative min-h-screen max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-8 w-56 max-w-[60%]" />
        </div>

        {/* Barra de búsqueda / orden */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-full max-w-xs rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>

        {/* Rejilla de productos */}
        <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
