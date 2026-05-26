import { Calendar, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SymbolBadge } from '@/components/ui/symbol-badge'
import { listWatchlistItems } from '@/lib/watchlist'
import {
  getUpcomingEarnings,
  getProfile,
  type FinnhubEarningsItem,
} from '@/lib/apis/finnhub'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const POPULAR = [
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'TSLA',
  'META',
  'AMZN',
  'NFLX',
]

const HOUR_LABELS: Record<string, string> = {
  bmo: 'Before open',
  amc: 'After close',
  dmh: 'During hours',
}

type EnrichedEarnings = FinnhubEarningsItem & {
  companyName: string | null
  inWatchlist: boolean
}

export default async function EarningsPage() {
  const watchlistItems = await listWatchlistItems()
  const watchlistSymbols = new Set(watchlistItems.map((i) => i.symbol))
  const symbols = Array.from(new Set([...watchlistSymbols, ...POPULAR]))

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const [earnings, profile] = await Promise.all([
          getUpcomingEarnings(symbol, 90).catch(() => []),
          getProfile(symbol).catch(() => null),
        ])
        return { symbol, earnings, profile }
      } catch {
        return { symbol, earnings: [], profile: null }
      }
    })
  )

  // Server component renders once per request; Date.now() is request-scoped.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const all: EnrichedEarnings[] = []
  for (const r of results) {
    for (const e of r.earnings) {
      const t = new Date(e.date).getTime()
      if (isNaN(t) || t < now - 24 * 60 * 60 * 1000) continue
      all.push({
        ...e,
        companyName: r.profile?.name ?? null,
        inWatchlist: watchlistSymbols.has(r.symbol),
      })
    }
  }

  all.sort((a, b) => a.date.localeCompare(b.date))

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const within7 = all.filter(
    (e) => new Date(e.date).getTime() <= now + sevenDaysMs
  )
  const within30 = all.filter((e) => {
    const t = new Date(e.date).getTime()
    return t > now + sevenDaysMs && t <= now + thirtyDaysMs
  })
  const later = all.filter(
    (e) => new Date(e.date).getTime() > now + thirtyDaysMs
  )

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon={Calendar}
        title="Earnings calendar"
        description={`Upcoming earnings for your watchlist + popular tickers · ${symbols.length} symbols tracked`}
      />

      {all.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-sm text-muted-foreground">
            No upcoming earnings reported in the next 90 days.
          </CardContent>
        </Card>
      ) : (
        <>
          {within7.length > 0 && (
            <Section title={`This week · ${within7.length}`} urgent>
              {within7.map((e) => (
                <EarningsRow key={`${e.symbol}-${e.date}`} earnings={e} />
              ))}
            </Section>
          )}
          {within30.length > 0 && (
            <Section title={`Within 30 days · ${within30.length}`}>
              {within30.map((e) => (
                <EarningsRow key={`${e.symbol}-${e.date}`} earnings={e} />
              ))}
            </Section>
          )}
          {later.length > 0 && (
            <Section title={`Later · ${later.length}`}>
              {later.map((e) => (
                <EarningsRow key={`${e.symbol}-${e.date}`} earnings={e} />
              ))}
            </Section>
          )}
        </>
      )}
    </main>
  )
}

function Section({
  title,
  urgent,
  children,
}: {
  title: string
  urgent?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2
        className={cn(
          'text-xs uppercase tracking-wide font-medium',
          urgent ? 'text-amber-400' : 'text-muted-foreground'
        )}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function EarningsRow({ earnings: e }: { earnings: EnrichedEarnings }) {
  const d = new Date(e.date)
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const hourLabel = e.hour ? HOUR_LABELS[e.hour] ?? null : null

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex flex-col gap-0.5 w-28 shrink-0">
          <span className="font-semibold text-sm tabular-nums">
            {dateLabel}
          </span>
          {hourLabel && (
            <span className="text-xs text-muted-foreground">{hourLabel}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SymbolBadge
              symbol={e.symbol}
              href={`/stocks/${e.symbol}`}
              size="sm"
              active={e.inWatchlist}
            />
            {e.inWatchlist && (
              <Badge
                variant="outline"
                className="border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 gap-1"
              >
                <Star aria-hidden className="size-3 fill-current" />
                <span>Watchlist</span>
              </Badge>
            )}
          </div>
          {e.companyName && (
            <p className="text-xs truncate text-muted-foreground mt-1">
              {e.companyName}
            </p>
          )}
        </div>
        <div className="text-right text-xs flex flex-col gap-0.5 shrink-0 text-muted-foreground">
          {e.epsEstimate != null && (
            <span>
              EPS est:{' '}
              <span className="tabular-nums font-medium text-foreground">
                ${e.epsEstimate.toFixed(2)}
              </span>
            </span>
          )}
          {e.revenueEstimate != null && (
            <span>
              Rev est:{' '}
              <span className="tabular-nums font-medium text-foreground">
                ${(e.revenueEstimate / 1e9).toFixed(2)}B
              </span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
