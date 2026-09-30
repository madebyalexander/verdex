export function EarningsSkeleton() {
  return (
    <div
      aria-hidden
      className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 ring-1 ring-white/[0.06]"
    >
      <div className="size-10 rounded-xl bg-muted animate-pulse" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="ml-auto h-8 w-40 rounded bg-muted animate-pulse" />
    </div>
  )
}
