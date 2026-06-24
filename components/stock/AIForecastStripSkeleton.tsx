import { cn } from '@/lib/utils'

export function AIForecastStripSkeleton() {
  return (
    <div
      aria-hidden
      className={cn(
        'flex items-center gap-3 flex-wrap rounded-xl px-3.5 py-2.5 ring-1 ring-inset',
        'bg-gradient-to-r from-primary/[0.08] via-card to-card ring-primary/20'
      )}
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
