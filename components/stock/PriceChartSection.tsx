import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getDailyOhlcv,
  AlphaVantageError,
  AlphaVantageRateLimitError,
} from '@/lib/apis/alpha-vantage'
import { PriceChart } from './PriceChart'
import { IoTime as Clock } from 'react-icons/io5'

export async function PriceChartSection({ symbol }: { symbol: string }) {
  let bars
  try {
    bars = await getDailyOhlcv(symbol)
  } catch (err) {
    if (err instanceof AlphaVantageRateLimitError) {
      return <ChartRateLimited />
    }
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
  const description = `${bars.length} daily bars · ${new Date(first.time).toLocaleDateString()} → ${new Date(last.time).toLocaleDateString()} · Alpha Vantage`

  return <PriceChart bars={bars} description={description} />
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

function ChartRateLimited() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price chart</CardTitle>
        <CardDescription>Alpha Vantage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span
            aria-hidden
            className="inline-flex items-center justify-center size-12 rounded-full bg-amber-500/10 text-amber-400"
          >
            <Clock className="size-6" />
          </span>
          <p className="text-sm font-medium">Daily quota reached</p>
          <p className="text-sm max-w-xs text-muted-foreground">
            Alpha Vantage&apos;s free tier allows 25 chart requests per day.
            Chart and indicators will resume tomorrow.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
