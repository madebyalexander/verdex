import { Card, CardContent } from '@/components/ui/card'
import { ChangeBadge } from '@/components/ui/change-badge'
import { getQuote } from '@/lib/apis/finnhub'
import { usd } from '@/lib/format'

const INDICES = [
  { symbol: 'SPY', label: 'S&P 500' },
  { symbol: 'QQQ', label: 'NASDAQ-100' },
  { symbol: 'DIA', label: 'Dow Jones' },
  { symbol: 'IWM', label: 'Russell 2000' },
] as const

export async function MarketOverview() {
  const quotes = await Promise.all(
    INDICES.map(async ({ symbol, label }) => {
      try {
        const quote = await getQuote(symbol)
        return { symbol, label, quote, error: false as const }
      } catch {
        return { symbol, label, quote: null, error: true as const }
      }
    })
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {quotes.map(({ symbol, label, quote, error }) => (
        <Card key={symbol}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {symbol}
                </p>
              </div>
              {!error && quote && (
                <ChangeBadge pct={quote.dp} />
              )}
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
      ))}
    </div>
  )
}
