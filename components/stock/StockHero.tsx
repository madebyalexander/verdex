import { Badge } from '@/components/ui/badge'
import { ChangeBadge } from '@/components/ui/change-badge'
import { WatchlistToggleButton } from '@/components/watchlist/WatchlistToggleButton'
import { CreateAlertButton } from '@/components/alerts/CreateAlertButton'
import { BuyNowButton } from '@/components/stock/BuyNowButton'
import type { FinnhubProfile, FinnhubQuote } from '@/lib/apis/finnhub'
import { usd } from '@/lib/format'

export function StockHero({
  symbol,
  profile,
  quote,
  logo,
  isInWatchlist,
  quickStats,
}: {
  symbol: string
  profile: FinnhubProfile
  quote: FinnhubQuote
  logo: string | null
  isInWatchlist: boolean
  quickStats?: React.ReactNode
}) {
  return (
    <header className="my-0 flex flex-col gap-10 py-0">
      <div className="my-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={`${profile.name} logo`}
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="size-9 shrink-0 rounded-md bg-secondary object-contain"
            />
          ) : (
            <div
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground"
            >
              {symbol.slice(0, 2)}
            </div>
          )}
          <div className="flex min-w-0 flex-col leading-tight">
            <div className="flex min-w-0 items-center gap-1.5">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {profile.name}
              </h1>
              <WatchlistToggleButton
                symbol={symbol}
                initialIn={isInWatchlist}
                iconOnly
              />
              {profile.finnhubIndustry && (
                <Badge
                  variant="secondary"
                  className="hidden shrink-0 md:inline-flex"
                >
                  {profile.finnhubIndustry}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs tabular-nums text-muted-foreground">
              {symbol}
              {profile.exchange && ` · ${profile.exchange}`}
            </p>
          </div>
        </div>

        <div className="my-0 flex shrink-0 flex-row items-center justify-between gap-3 sm:justify-center">
          <div className="flex flex-row items-end justify-start gap-3">
            <span className="text-xl font-semibold tabular-nums tracking-tight leading-none sm:text-2xl">
              {usd(quote.c)}
            </span>
            <ChangeBadge pct={quote.dp} size="xs" />
          </div>
          <div className="flex items-center justify-center gap-3 py-0">
            <CreateAlertButton
              symbol={symbol}
              currentPrice={quote.c}
              iconOnly
            />
            <BuyNowButton symbol={symbol} />
          </div>
        </div>
      </div>

      {quickStats}
    </header>
  )
}
