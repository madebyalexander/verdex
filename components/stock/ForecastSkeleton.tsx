import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function ForecastSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>AI Forecast</CardTitle>
          <Badge
            variant="outline"
            className="border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
          >
            AI estimate — not advice
          </Badge>
        </div>
        <CardDescription>
          Generating forecast — this may take 5–15 seconds…
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
        </div>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-20" />
      </CardContent>
    </Card>
  )
}
