import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function WatchlistSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card variant="list">
      <CardHeader>
        <CardTitle>
          <span className="inline-block h-5 w-32 rounded bg-muted animate-pulse align-middle" />
        </CardTitle>
        <CardDescription>
          <span className="inline-block h-3 w-44 rounded bg-muted animate-pulse align-middle" />
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-3">
              <div className="size-9 rounded-md bg-muted animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                <div className="h-3 w-40 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-14 rounded-full bg-muted animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
