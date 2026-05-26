import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChangeBadge } from '@/components/ui/change-badge'
import { listWatchlistItems } from '@/lib/watchlist'
import { getQuote } from '@/lib/apis/finnhub'
import { usd } from '@/lib/format'

export async function WatchlistSummary() {
  const items = await listWatchlistItems()
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t saved any stocks yet.{' '}
            <Link
              href="/stocks/AAPL"
              className="text-primary underline underline-offset-2"
            >
              Try AAPL
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  const enriched = await Promise.all(
    items.slice(0, 4).map(async (item) => {
      try {
        const quote = await getQuote(item.symbol)
        return { ...item, quote, error: false as const }
      } catch {
        return { ...item, quote: null, error: true as const }
      }
    })
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {enriched.map(({ symbol, quote, error }) => (
          <Link
            key={symbol}
            href={`/stocks/${symbol}`}
            className="block transition-opacity hover:opacity-90"
          >
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{symbol}</p>
                  {!error && quote && <ChangeBadge pct={quote.dp} />}
                </div>
                {error || !quote ? (
                  <p className="text-sm text-muted-foreground">Unavailable</p>
                ) : (
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">
                    {usd(quote.c)}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {items.length > 4 && (
        <div className="flex justify-end">
          <Link
            href="/watchlist"
            className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
          >
            View all ({items.length}) →
          </Link>
        </div>
      )}
    </div>
  )
}
