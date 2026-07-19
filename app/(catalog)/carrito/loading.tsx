import { Skeleton } from '@/components/ui/Skeleton'

export default function CarritoLoading() {
  return (
    <div className="relative min-h-screen pb-16 max-md:pt-[6.5rem] pt-28 sm:pt-32">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          {/* Items */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-[var(--border-subtle)] p-4"
              >
                <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-3 py-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="space-y-4 self-start rounded-xl border border-[var(--border-subtle)] p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
