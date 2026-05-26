import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalystSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
        <CardDescription>Loading…</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3 rounded-md" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
