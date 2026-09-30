import { Card, CardContent } from '@/components/ui/card'

export function NewsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start" aria-hidden>
      <div className="flex flex-col gap-4 lg:order-2">
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 w-16 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4 lg:order-1 lg:col-span-2">
        <div className="h-36 rounded-[20px] bg-muted/60 animate-pulse" />
        <Card variant="list" className="gap-0 py-0">
          <ul className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <li key={i} className="flex gap-3 px-5 py-3">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-[85%] rounded bg-muted animate-pulse" />
                  <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-14 w-20 rounded-lg bg-muted animate-pulse" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
