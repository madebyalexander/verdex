import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import { EarningsSection } from '@/components/stock/EarningsSection'
import { EarningsSkeleton } from '@/components/stock/EarningsSkeleton'
import { StockHero } from '@/components/stock/StockHero'
import { QuickStatsStrip } from '@/components/stock/QuickStatsStrip'
import { QuickStatsStripSkeleton } from '@/components/stock/QuickStatsStripSkeleton'
import { checkInWatchlist } from '@/lib/watchlist'
import { readPreferences } from '@/lib/preferences.server'
import { TriggeredAlerts } from '@/components/alerts/TriggeredAlerts'
import { PageContainer } from '@/components/layout/PageContainer'
import { CardStack } from '@/components/layout/CardStack'

import { compactUsd, compactNum } from '@/lib/format'
import { IoSparkles as Sparks } from 'react-icons/io5'

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
  const prefs = await readPreferences()

  const logo = resolveLogo(profile)
  const marketCapUsd = (profile.marketCapitalization ?? 0) * 1_000_000
  const sharesOutCount = (profile.shareOutstanding ?? 0) * 1_000_000

  return (
    <PageContainer>
      <TriggeredAlerts symbol={symbol} currentPrice={quote.c} />

      <StockHero
        symbol={symbol}
        profile={profile}
        quote={quote}
        logo={logo}
        isInWatchlist={isInWatchlist}
        quickStats={
          <Suspense fallback={<QuickStatsStripSkeleton />}>
            <QuickStatsStrip
              symbol={symbol}
              quote={quote}
              marketCapUsd={marketCapUsd}
            />
          </Suspense>
        }
      />

      <Suspense fallback={<PriceChartSkeleton />}>
        <PriceChartSection symbol={symbol} />
      </Suspense>

      <Tabs defaultValue="forecast">
          <TabsList className="self-start">
            <TabsTrigger
              value="forecast"
              className="data-active:text-primary"
            >
              <Sparks aria-hidden className="size-3.5" />
              <span>AI Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="simple:hidden">
              Analysis
            </TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <p className="technical:hidden -mt-1 text-xs text-muted-foreground">
            Switch to <span className="font-medium text-foreground">Technical</span>{' '}
            mode (top right) for indicators, analyst ratings, insider activity &
            earnings.
          </p>

          <TabsContent value="forecast">
            <Suspense fallback={<ForecastSkeleton />}>
              <ForecastSection
                symbol={symbol}
                preferredHorizon={prefs.default_forecast_horizon}
                riskProfile={prefs.risk_profile}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="analysis" className="simple:hidden">
            <CardStack>
              <Suspense fallback={<IndicatorsSkeleton />}>
                <IndicatorsSection symbol={symbol} />
              </Suspense>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Suspense fallback={<AnalystSkeleton />}>
                  <AnalystSection symbol={symbol} />
                </Suspense>
                <Suspense fallback={<InsiderSkeleton />}>
                  <InsiderSection symbol={symbol} />
                </Suspense>
              </div>
              <Suspense fallback={<EarningsSkeleton />}>
                <EarningsSection symbol={symbol} />
              </Suspense>
            </CardStack>
          </TabsContent>

          <TabsContent value="news">
            <Suspense fallback={<NewsSkeleton />}>
              <NewsSection symbol={symbol} />
            </Suspense>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
                <CardDescription>Profile data from Finnhub</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                {!!profile.marketCapitalization && (
                  <Detail
                    label="Market cap"
                    value={compactUsd(marketCapUsd)}
                  />
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
          </TabsContent>
        </Tabs>
    </PageContainer>
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
