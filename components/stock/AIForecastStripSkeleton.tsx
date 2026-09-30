export function AIForecastStripSkeleton() {
  return (
    <div
      aria-hidden
      className="ai-surface relative flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 ring-1 ring-primary/20"
    >
      <div className="size-5 rounded-full bg-primary/20 animate-pulse shrink-0" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
      <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
      <div className="h-3 w-44 rounded bg-muted animate-pulse ml-auto" />
    </div>
  )
}
