import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AlertsSkeleton() {
  return (
    <>
      <BucketSkeleton title="Active" rows={3} />
      <BucketSkeleton title="Triggered" rows={2} />
    </>
  )
}

function BucketSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <Card variant="list">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="inline-block h-3 w-56 rounded bg-muted animate-pulse align-middle" />
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-6 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-7 w-7 rounded-md bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
