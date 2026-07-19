import { Skeleton, ProductDetailSkeleton } from '@/components/ui/Skeleton'

export default function ProductoDetalleLoading() {
  return (
    <div className="relative min-h-screen max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        {/* Navegación / breadcrumb */}
        <div className="mb-8 flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>

        <ProductDetailSkeleton />
      </div>
    </div>
  )
}
