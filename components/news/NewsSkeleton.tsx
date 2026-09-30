import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function NewsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card variant="list">
      <CardHeader>
        <CardTitle>Latest headlines</CardTitle>
        <CardDescription>
          <span className="inline-block h-3 w-44 rounded bg-muted animate-pulse align-middle" />
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="px-5 py-3 flex flex-col gap-2">
              <div className="h-4 w-[90%] rounded bg-muted animate-pulse" />
              <div className="h-4 w-[55%] rounded bg-muted animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                <div className="h-5 w-14 rounded bg-muted animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
