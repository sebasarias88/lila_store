import { Skeleton, ProductCardSkeleton } from '@/components/ui/Skeleton'

export default function ProductosLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[rgba(169,137,224,0.08)] to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 pb-6">
          <Skeleton className="mb-3 h-7 w-28 rounded-full" />
          <Skeleton className="h-10 w-64 max-w-[70%] rounded-xl" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full rounded-lg" />
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-white/80 p-4 shadow-[var(--shadow-soft)]">
          <Skeleton className="h-11 w-full max-w-md rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
