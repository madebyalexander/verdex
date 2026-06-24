import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PriceChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price chart</CardTitle>
        <CardDescription>Loading 100 days of OHLC data…</CardDescription>
        <CardAction className="self-center">
          <div
            aria-hidden
            className="flex items-center gap-1"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-10 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-md" style={{ height: 400 }} />
      </CardContent>
    </Card>
  )
}
