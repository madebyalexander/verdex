export function StockHeroSkeleton() {
  return (
    <header className="flex flex-col gap-6" aria-hidden>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="size-14 shrink-0 rounded-2xl bg-muted animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-2xl bg-muted animate-pulse" />
          <div className="size-9 rounded-2xl bg-muted animate-pulse" />
          <div className="h-9 w-20 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-11 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-3 w-64 rounded bg-muted animate-pulse" />
      </div>
    </header>
  )
}
