import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getDailyOhlcv,
  AlphaVantageError,
  AlphaVantageRateLimitError,
} from '@/lib/apis/alpha-vantage'
import { PriceChart } from './PriceChart'
import { IoTime as Clock, IoAnalytics as ChartIcon } from 'react-icons/io5'

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
  const description = `Daily closes · ${new Date(first.time).toLocaleDateString()} – ${new Date(last.time).toLocaleDateString()} · Source: Alpha Vantage`

  return <PriceChart bars={bars} description={description} />
}

function ChartError({ message }: { message: string }) {
  return (
    <Card>
      <EmptyState
        icon={ChartIcon}
        tone="muted"
        title="Chart unavailable"
        description={message}
        className="py-16"
      />
    </Card>
  )
}

function ChartRateLimited() {
  return (
    <Card>
      <EmptyState
        icon={Clock}
        tone="warning"
        title="Daily chart quota reached"
        description="Alpha Vantage's free tier allows 25 chart requests per day. The chart and indicators will be back tomorrow — quotes and the AI forecast still work."
        className="py-16"
      />
    </Card>
  )
}
