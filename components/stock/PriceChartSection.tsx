import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getDailyOhlcv, AlphaVantageError } from '@/lib/apis/alpha-vantage'
import { PriceChart } from './PriceChart'

export async function PriceChartSection({ symbol }: { symbol: string }) {
  let bars
  try {
    bars = await getDailyOhlcv(symbol)
  } catch (err) {
    const message =
      err instanceof AlphaVantageError
        ? err.message
        : 'Failed to load chart data.'
    return <ChartError message={message} />
  }

  if (bars.length === 0) {
    return <ChartError message="No historical data available for this symbol." />
  }

  const last = bars[bars.length - 1]
  const first = bars[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price chart</CardTitle>
        <CardDescription>
          {bars.length} daily bars ·{' '}
          {new Date(first.time).toLocaleDateString()} →{' '}
          {new Date(last.time).toLocaleDateString()} · Alpha Vantage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PriceChart bars={bars} />
      </CardContent>
    </Card>
  )
}

function ChartError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price chart</CardTitle>
      </CardHeader>
      <CardContent className="text-sm py-12 rounded-md text-center text-muted-foreground bg-secondary">
        {message}
      </CardContent>
    </Card>
  )
}
