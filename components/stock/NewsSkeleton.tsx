import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NewsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent news</CardTitle>
        <CardDescription>Loading articles…</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
