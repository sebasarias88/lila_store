import { Skeleton, ProductCardSkeleton } from '@/components/ui/Skeleton'

function SectionHeaderSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="mb-8 border-b border-[var(--border-subtle)] pb-8">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-px w-8" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className={`h-8 ${wide ? 'w-72 max-w-[85%]' : 'w-56 max-w-[70%]'}`} />
      <Skeleton className="mt-3 h-4 w-64 max-w-[90%]" />
    </div>
  )
}

function CarouselSkeleton({ muted = false }: { muted?: boolean }) {
  return (
    <section className={`py-12 sm:py-14 ${muted ? 'bg-[var(--bg-muted)]' : ''}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionHeaderSkeleton wide />
        <div className="flex gap-3 overflow-hidden sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[68vw] shrink-0 border border-[var(--border-card)] bg-[var(--bg-card)] sm:w-[240px] lg:w-[260px]"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

type HomePageSkeletonProps = {
  /** Extra top padding for mayoreo announcement bar */
  mayoreo?: boolean
}

export default function HomePageSkeleton({ mayoreo = false }: HomePageSkeletonProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero — banner limpio, luego destacados */}
      <section className="relative w-full overflow-hidden bg-[var(--bg-muted)] pt-[calc(2.25rem+3.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(2.25rem+4rem)]">
        <div className="relative aspect-[16/10] w-full md:aspect-auto md:h-[min(72svh,760px)] md:min-h-[320px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        </div>
      </section>

      {/* Promociones */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[5/3] w-full" />
          ))}
        </div>
      </section>

      {mayoreo && (
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Categorías — una vista completa */}
      <section className="mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 shrink-0 sm:mb-5">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-7 w-40 sm:h-8" />
          <Skeleton className="mt-2 h-3 w-64 max-w-[90%]" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1.15fr_1fr_1fr] gap-2.5 sm:gap-3 md:grid-cols-4 md:grid-rows-2">
          <Skeleton className="col-span-2 row-span-1 h-full w-full md:row-span-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-full" />
          ))}
        </div>
        <div className="mt-4 flex shrink-0 justify-center sm:mt-5">
          <Skeleton className="h-10 w-48" />
        </div>
      </section>

      {/* Destacados */}
      <CarouselSkeleton />

      {/* Ofertas */}
      <CarouselSkeleton muted />

      {/* Novedades */}
      <CarouselSkeleton />

      {/* Testimonios */}
      <section className="bg-[var(--bg-muted)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-72 max-w-[85%]" />
            <Skeleton className="h-4 w-56 max-w-[70%]" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-[85vw] shrink-0 border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:w-[320px]"
              >
                <Skeleton className="mb-4 h-5 w-5" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-6 h-px w-full" />
                <Skeleton className="mt-4 h-3 w-28" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeaderSkeleton wide />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-6 h-12 w-56" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso pedido */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex justify-between gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-[108px] shrink-0 flex-col items-center gap-3 sm:w-[128px]">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
