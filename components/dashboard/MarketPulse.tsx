import { Card, CardContent } from '@/components/ui/card'
import { ChangeText } from '@/components/ui/change-badge'
import { getQuote, type FinnhubQuote } from '@/lib/apis/finnhub'
import { usd } from '@/lib/format'

// Finnhub's free tier doesn't quote raw indices, so we track each benchmark
// through its most liquid ETF and say so in the UI.
const BENCHMARKS = [
  { symbol: 'SPY', label: 'S&P 500' },
  { symbol: 'QQQ', label: 'Nasdaq 100' },
  { symbol: 'DIA', label: 'Dow Jones' },
  { symbol: 'IWM', label: 'Russell 2000' },
] as const

export async function MarketPulse() {
  const quotes = await Promise.all(
    BENCHMARKS.map(async (b) => {
      try {
        return { ...b, quote: await getQuote(b.symbol) }
      } catch (err) {
        console.error('[MarketPulse]', b.symbol, err)
        return { ...b, quote: null as FinnhubQuote | null }
      }
    })
  )

  if (quotes.every((q) => q.quote === null)) {
    return (
      <Card size="sm">
        <CardContent className="py-2 text-center text-sm text-muted-foreground">
          Benchmark quotes are unavailable right now.
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {quotes.map(({ symbol, label, quote }) => (
        <li key={symbol}>
          <Card size="sm" className="h-full gap-3">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{label}</span>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {symbol}
                </span>
              </div>
              {quote ? (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-semibold tracking-tight tabular-nums">
                      {usd(quote.c)}
                    </span>
                    <ChangeText pct={quote.dp} abs={quote.d} className="text-xs" />
                  </div>
                  <DayRange low={quote.l} high={quote.h} value={quote.c} />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Unavailable</span>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function DayRange({ low, high, value }: { low: number; high: number; value: number }) {
  if (!(high > low)) return null
  const pct = Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
  return (
    <div
      role="img"
      aria-label={`Day range ${usd(low)} to ${usd(high)}`}
      className="relative h-1 rounded-full bg-white/[0.06]"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/15"
        style={{ width: `${pct}%` }}
      />
      <span
        className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}

export function MarketPulseSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <Card size="sm" className="gap-3">
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-6 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-1 rounded-full bg-muted animate-pulse" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
