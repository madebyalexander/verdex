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
import { AIForecastStrip } from '@/components/stock/AIForecastStrip'
import { QuickStatsStrip } from '@/components/stock/QuickStatsStrip'
import { QuickStatsStripSkeleton } from '@/components/stock/QuickStatsStripSkeleton'
import { checkInWatchlist } from '@/lib/watchlist'
import { readPreferences } from '@/lib/preferences.server'
import { TriggeredAlerts } from '@/components/alerts/TriggeredAlerts'
import { PageContainer } from '@/components/layout/PageContainer'
import { CardStack } from '@/components/layout/CardStack'

import { compactUsd, compactNum } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  IoSparkles as Sparks,
  IoBulb as Bulb,
  IoOpenOutline as ExternalLink,
} from 'react-icons/io5'

// Underline tabs: indicator sits on the list's bottom border.
const TAB_CLASS =
  'h-full flex-none px-3 text-[15px] group-data-horizontal/tabs:after:bottom-[-1px]'

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
    <PageContainer className="gap-6">
      <TriggeredAlerts symbol={symbol} currentPrice={quote.c} />

      <StockHero
        symbol={symbol}
        profile={profile}
        quote={quote}
        logo={logo}
        isInWatchlist={isInWatchlist}
      />

      <Suspense fallback={null}>
        <AIForecastStrip symbol={symbol} currentPrice={quote.c} />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Suspense fallback={<PriceChartSkeleton />}>
            <PriceChartSection symbol={symbol} />
          </Suspense>
        </div>
        <Suspense fallback={<QuickStatsStripSkeleton />}>
          <QuickStatsStrip
            symbol={symbol}
            quote={quote}
            marketCapUsd={marketCapUsd}
          />
        </Suspense>
      </div>

      <section id="ai-forecast" aria-label="Research" className="scroll-mt-20 pt-2">
        <Tabs defaultValue="forecast" className="gap-6">
          <TabsList
            variant="line"
            className="h-11 w-full justify-start gap-1 rounded-none border-b border-border p-0"
          >
            <TabsTrigger value="forecast" className={TAB_CLASS}>
              <Sparks aria-hidden className="size-3.5 text-primary" />
              <span>AI Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className={cn(TAB_CLASS, 'simple:hidden')}>
              Analysis
            </TabsTrigger>
            <TabsTrigger value="news" className={TAB_CLASS}>
              News
            </TabsTrigger>
            <TabsTrigger value="profile" className={TAB_CLASS}>
              Company
            </TabsTrigger>
          </TabsList>

          <p className="technical:hidden -mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Bulb aria-hidden className="size-3.5 shrink-0 text-primary" />
            <span>
              Switch to{' '}
              <span className="font-medium text-foreground">Technical</span> mode
              (top right) for candlesticks, indicators, analyst ratings, insider
              activity and earnings.
            </span>
          </p>

          <TabsContent value="forecast">
            <Suspense fallback={<ForecastSkeleton />}>
              <ForecastSection
                symbol={symbol}
                currentPrice={quote.c}
                preferredHorizon={prefs.default_forecast_horizon}
                riskProfile={prefs.risk_profile}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="analysis" className="simple:hidden">
            <CardStack className="gap-4">
              <Suspense fallback={<IndicatorsSkeleton />}>
                <IndicatorsSection symbol={symbol} />
              </Suspense>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <CardTitle>About {profile.name}</CardTitle>
                <CardDescription>Company profile · Finnhub</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm md:grid-cols-3">
                  {profile.finnhubIndustry && (
                    <Detail label="Industry" value={profile.finnhubIndustry} />
                  )}
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
                  {profile.ipo && <Detail label="IPO date" value={profile.ipo} />}
                  {profile.weburl && (
                    <Detail
                      label="Website"
                      value={
                        <a
                          href={profile.weburl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
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
                          <ExternalLink aria-hidden className="size-3" />
                        </a>
                      }
                    />
                  )}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
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
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
