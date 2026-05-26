import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChangeBadge } from '@/components/ui/change-badge'
import {
  getQuote,
  getProfile,
  UnknownSymbolError,
  type FinnhubQuote,
  type FinnhubProfile,
} from '@/lib/apis/finnhub'
import { ForecastSection } from '@/components/stock/ForecastSection'
import { ForecastSkeleton } from '@/components/stock/ForecastSkeleton'
import { PriceChartSection } from '@/components/stock/PriceChartSection'
import { PriceChartSkeleton } from '@/components/stock/PriceChartSkeleton'
import { NewsSection } from '@/components/stock/NewsSection'
import { NewsSkeleton } from '@/components/stock/NewsSkeleton'
import { AnalystSection } from '@/components/stock/AnalystSection'
import { AnalystSkeleton } from '@/components/stock/AnalystSkeleton'
import { InsiderSection } from '@/components/stock/InsiderSection'
import { InsiderSkeleton } from '@/components/stock/InsiderSkeleton'
import { IndicatorsSection } from '@/components/stock/IndicatorsSection'
import { IndicatorsSkeleton } from '@/components/stock/IndicatorsSkeleton'
import { checkInWatchlist } from '@/lib/watchlist'
import { WatchlistToggleButton } from '@/components/watchlist/WatchlistToggleButton'
import { CreateAlertButton } from '@/components/alerts/CreateAlertButton'
import { TriggeredAlerts } from '@/components/alerts/TriggeredAlerts'

import { usd, compactUsd, compactNum } from '@/lib/format'

function resolveLogo(profile: FinnhubProfile): string | null {
  if (profile.logo && profile.logo.length > 0) return profile.logo
  if (profile.weburl) {
    try {
      const host = new URL(profile.weburl).hostname.replace(/^www\./, '')
      return `https://logo.clearbit.com/${host}`
    } catch {
      // fall through
    }
  }
  return null
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol: raw } = await params
  const symbol = raw?.trim().toUpperCase() ?? ''
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) notFound()

  let quote: FinnhubQuote
  let profile: FinnhubProfile
  try {
    ;[quote, profile] = await Promise.all([
      getQuote(symbol),
      getProfile(symbol),
    ])
  } catch (err) {
    if (err instanceof UnknownSymbolError) notFound()
    throw err
  }

  const isInWatchlist = await checkInWatchlist(symbol)

  const logo = resolveLogo(profile)
  const marketCapUsd = (profile.marketCapitalization ?? 0) * 1_000_000
  const sharesOutCount = (profile.shareOutstanding ?? 0) * 1_000_000

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <TriggeredAlerts symbol={symbol} currentPrice={quote.c} />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={`${profile.name} logo`}
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="rounded-md object-contain shrink-0 bg-secondary"
                />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.finnhubIndustry && (
                    <Badge variant="secondary">
                      {profile.finnhubIndustry}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {symbol}
                  {profile.exchange && ` · ${profile.exchange}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CreateAlertButton symbol={symbol} currentPrice={quote.c} />
              <WatchlistToggleButton
                symbol={symbol}
                initialIn={isInWatchlist}
              />
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {usd(quote.c)}
            </span>
            <ChangeBadge pct={quote.dp} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Open" value={usd(quote.o)} />
        <Stat label="High" value={usd(quote.h)} />
        <Stat label="Low" value={usd(quote.l)} />
        <Stat label="Prev close" value={usd(quote.pc)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
          {!!profile.marketCapitalization && (
            <Detail label="Market cap" value={compactUsd(marketCapUsd)} />
          )}
          {!!profile.shareOutstanding && (
            <Detail
              label="Shares outstanding"
              value={compactNum(sharesOutCount)}
            />
          )}
          {profile.country && (
            <Detail label="Country" value={profile.country} />
          )}
          {profile.currency && (
            <Detail label="Currency" value={profile.currency} />
          )}
          {profile.ipo && <Detail label="IPO" value={profile.ipo} />}
          {profile.weburl && (
            <Detail
              label="Website"
              value={
                <a
                  href={profile.weburl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  {(() => {
                    try {
                      return new URL(profile.weburl).hostname.replace(
                        /^www\./,
                        ''
                      )
                    } catch {
                      return profile.weburl
                    }
                  })()}
                </a>
              }
            />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={<PriceChartSkeleton />}>
        <PriceChartSection symbol={symbol} />
      </Suspense>

      <Suspense fallback={<IndicatorsSkeleton />}>
        <IndicatorsSection symbol={symbol} />
      </Suspense>

      <Suspense fallback={<ForecastSkeleton />}>
        <ForecastSection symbol={symbol} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<AnalystSkeleton />}>
          <AnalystSection symbol={symbol} />
        </Suspense>
        <Suspense fallback={<InsiderSkeleton />}>
          <InsiderSection symbol={symbol} />
        </Suspense>
      </div>

      <Suspense fallback={<NewsSkeleton />}>
        <NewsSection symbol={symbol} />
      </Suspense>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-semibold tabular-nums mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
