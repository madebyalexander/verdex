import { QuickStatsStripSkeleton } from '@/components/stock/QuickStatsStripSkeleton'

export function StockHeroSkeleton() {
  return (
    <header className="my-0 flex flex-col gap-10 py-0">
      <div className="my-0 flex flex-row items-center justify-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="size-9 shrink-0 rounded-md bg-muted animate-pulse" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="size-7 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>

        <div className="my-0 flex shrink-0 flex-row items-start justify-center gap-3">
          <div className="flex flex-row items-end justify-start gap-3">
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-14 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-3 py-0">
            <div className="size-7 rounded-md bg-muted animate-pulse" />
            <div className="h-7 w-20 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      <QuickStatsStripSkeleton />
    </header>
  )
}
