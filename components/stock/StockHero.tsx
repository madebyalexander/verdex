import { Badge } from '@/components/ui/badge'
import { ChangeText } from '@/components/ui/change-badge'
import { WatchlistToggleButton } from '@/components/watchlist/WatchlistToggleButton'
import { CreateAlertButton } from '@/components/alerts/CreateAlertButton'
import { BuyNowButton } from '@/components/stock/BuyNowButton'
import type { FinnhubProfile, FinnhubQuote } from '@/lib/apis/finnhub'
import { usd } from '@/lib/format'

/** "NASDAQ NMS - GLOBAL MARKET" → "NASDAQ", "NEW YORK STOCK EXCHANGE, INC." → "NYSE". */
function shortExchange(exchange?: string): string | null {
  if (!exchange) return null
  const upper = exchange.toUpperCase()
  if (upper.includes('NASDAQ')) return 'NASDAQ'
  if (upper.includes('NEW YORK')) return 'NYSE'
  return exchange.split(/\s[-,]\s?/)[0]
}

function asOfLabel(unixSeconds: number): string | null {
  if (!unixSeconds) return null
  return `${new Date(unixSeconds * 1000).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} ET`
}

export function StockHero({
  symbol,
  profile,
  quote,
  logo,
  isInWatchlist,
}: {
  symbol: string
  profile: FinnhubProfile
  quote: FinnhubQuote
  logo: string | null
  isInWatchlist: boolean
}) {
  const exchange = shortExchange(profile.exchange)
  const asOf = asOfLabel(quote.t)

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {logo ? (
            // White tile: most company marks are drawn for light backgrounds.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={`${profile.name} logo`}
              width={56}
              height={56}
              decoding="async"
              className="size-14 shrink-0 rounded-2xl bg-white object-contain p-2 ring-1 ring-white/10"
            />
          ) : (
            <div
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-base font-semibold text-muted-foreground ring-1 ring-inset ring-white/10"
            >
              {symbol.slice(0, 2)}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {profile.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground/90">
                {symbol}
              </span>
              {exchange && (
                <>
                  <span aria-hidden className="text-muted-foreground/50">·</span>
                  <span>{exchange}</span>
                </>
              )}
              {profile.finnhubIndustry && (
                <Badge
                  variant="outline"
                  className="ml-1 border-transparent bg-white/[0.05] text-muted-foreground ring-1 ring-inset ring-white/[0.08]"
                >
                  {profile.finnhubIndustry}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WatchlistToggleButton symbol={symbol} initialIn={isInWatchlist} />
          <CreateAlertButton symbol={symbol} currentPrice={quote.c} iconOnly />
          <BuyNowButton symbol={symbol} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {usd(quote.c)}
          </span>
          <ChangeText
            pct={quote.dp}
            abs={quote.d}
            label="Today"
            className="text-base"
          />
        </div>
        {asOf && (
          <p className="text-xs text-muted-foreground">
            As of {asOf} · Previous close {usd(quote.pc)}
          </p>
        )}
      </div>
    </header>
  )
}
