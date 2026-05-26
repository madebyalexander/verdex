import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CompareSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Overlay chart</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full rounded-md" style={{ height: 420 }} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Side-by-side</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 rounded-md" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
