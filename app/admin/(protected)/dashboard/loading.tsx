import { Skeleton } from '@/components/ui/Skeleton'

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[rgba(169,137,224,0.22)] bg-[var(--bg-card)] p-5">
      <div className="mb-5 flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-8 w-16" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex h-[4.75rem] items-center gap-4 border-b border-[rgba(169,137,224,0.08)] px-5 last:border-b-0">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <>
      {/* Mobile */}
      <div className="px-4 pt-2 md:hidden">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="mb-6 h-7 w-40" />
        <div className="mb-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-[rgba(169,137,224,0.18)] bg-[var(--bg-card)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden min-h-screen bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10 md:block">
        {/* Header */}
        <div className="mb-10 border-b border-[rgba(169,137,224,0.16)] pb-8">
          <Skeleton className="mb-3 h-3 w-16" />
          <Skeleton className="h-9 w-52" />
          <Skeleton className="mt-3 h-3 w-64 max-w-[60%]" />
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Accesos + inventario */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Skeleton className="mb-5 h-3 w-32" />
            <div className="overflow-hidden rounded-xl border border-[rgba(169,137,224,0.18)] bg-[var(--bg-card)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="mb-5 h-3 w-40" />
            <div className="overflow-hidden rounded-xl border border-[rgba(169,137,224,0.18)] bg-[var(--bg-card)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Recientes */}
        <div className="mt-10">
          <Skeleton className="mb-5 h-3 w-44" />
          <div className="overflow-hidden rounded-xl border border-[rgba(169,137,224,0.18)] bg-[var(--bg-card)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
