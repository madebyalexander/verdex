import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function QuickStatsStripSkeleton() {
  return (
    <Card className="h-full" aria-busy="true" aria-label="Loading key statistics">
      <CardHeader>
        <CardTitle>Key statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
