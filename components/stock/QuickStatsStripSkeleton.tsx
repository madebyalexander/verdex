import { Card, CardContent } from '@/components/ui/card'

export function QuickStatsStripSkeleton() {
  return (
    <Card className="py-0">
      <CardContent className="my-0 flex flex-col gap-3 py-5">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-2 sm:gap-y-0 sm:divide-x sm:divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 sm:items-center sm:px-3 first:pl-0 last:pr-0 leading-tight"
            >
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-3 border-t border-border/40">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
              <div className="flex justify-between">
                <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
