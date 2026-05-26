import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function InsiderSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insider transactions</CardTitle>
        <CardDescription>Loading…</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
