import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function IndicatorsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical indicators</CardTitle>
        <CardDescription>Computing…</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}
