import { cn } from '@/lib/utils'

export function AIInsightsSkeleton() {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl ring-1 ring-foreground/10 bg-card',
        'bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.18)_0%,rgba(16,185,129,0.06)_35%,transparent_65%)]'
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-full bg-emerald-500/20 animate-pulse" />
            <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <div className="flex items-center gap-3">
              <div className="h-3 w-6 rounded bg-muted animate-pulse" />
              <div className="h-3 w-14 rounded bg-muted animate-pulse" />
              <div className="h-3 w-6 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
          <div className="min-w-0 flex-1 lg:flex-[3]">
            <div className="flex h-full flex-col gap-3 rounded-xl bg-card/40 p-3 ring-1 ring-inset ring-emerald-500/30">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3">
                <div className="size-8 rounded-lg bg-muted animate-pulse" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="flex flex-1 flex-col items-start gap-3 w-full">
                <div className="flex flex-col items-start gap-1">
                  <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                </div>
                <ul className="flex w-full flex-col gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 h-3 rounded bg-muted animate-pulse" />
                      <div className="w-14 h-1 rounded-full bg-muted animate-pulse" />
                      <div className="w-8 h-3 rounded bg-muted animate-pulse" />
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex w-full gap-3 pt-2 border-t border-border/40">
                  <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-[2] lg:max-w-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="flex min-h-0 flex-1 flex-col gap-2 h-full rounded-xl bg-card/40 ring-1 ring-inset ring-border/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-md bg-muted animate-pulse" />
                    <div className="h-3.5 w-12 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-3 w-40 rounded bg-muted animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
