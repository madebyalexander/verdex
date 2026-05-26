import {
  Card,
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
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-md" style={{ height: 400 }} />
      </CardContent>
    </Card>
  )
}
