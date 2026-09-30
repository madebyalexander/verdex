import { AICard } from '@/components/ui/ai-card'

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-white/[0.06] animate-pulse ${className}`} />
}

export function AIInsightsSkeleton() {
  return (
    <AICard className="gap-0 py-0" aria-busy="true" aria-label="Loading AI insights">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/15 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <Bar className="h-4 w-24" />
            <Bar className="h-3 w-40" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bar className="h-5 w-28 rounded-full" />
          <Bar className="h-5 w-36 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 rounded-2xl bg-black/25 p-5 ring-1 ring-inset ring-primary/25 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-white/[0.06] animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <Bar className="h-5 w-36" />
              <Bar className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <Bar className="h-3 w-28" />
              <Bar className="h-9 w-32" />
            </div>
            <div className="flex gap-5">
              <Bar className="h-8 w-10" />
              <Bar className="h-8 w-10" />
              <Bar className="h-8 w-10" />
            </div>
          </div>
          <Bar className="h-1.5 w-full rounded-full" />
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bar key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Bar className="mx-1 h-3 w-24" />
          <div className="flex flex-col divide-y divide-white/[0.06] rounded-2xl bg-black/20 ring-1 ring-inset ring-white/[0.06]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                <div className="size-9 rounded-lg bg-white/[0.06] animate-pulse" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Bar className="h-3.5 w-14" />
                  <Bar className="h-3 w-32" />
                </div>
                <Bar className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AICard>
  )
}
