import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChangeBadge } from '@/components/ui/change-badge'
import {
  listAllWatchlists,
  listWatchlistItems,
  type WatchlistItem,
} from '@/lib/watchlist'
import { getQuote, getProfile } from '@/lib/apis/finnhub'
import type { FinnhubQuote, FinnhubProfile } from '@/lib/apis/finnhub'
import { WatchlistsTabs } from '@/components/watchlist/WatchlistsTabs'
import { WatchlistSkeleton } from '@/components/watchlist/WatchlistSkeleton'
import { AlertsSection } from '@/components/alerts/AlertsSection'
import { AlertsSkeleton } from '@/components/alerts/AlertsSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { CardStack } from '@/components/layout/CardStack'
import { cn } from '@/lib/utils'

import { usd } from '@/lib/format'
import { IoStar as Star } from 'react-icons/io5'

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

type EnrichedItem = WatchlistItem & {
  quote?: FinnhubQuote
  profile?: FinnhubProfile
  error: boolean
}

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id: requestedId } = await searchParams
  return (
    <PageContainer width="narrow">
      <PageHeader
        icon={Star}
        title="Watchlist"
        description="Your tracked stocks and price alerts"
      />
      <CardStack>
        <Suspense
          key={requestedId ?? '_'}
          fallback={<WatchlistSkeleton />}
        >
          <WatchlistContent requestedId={requestedId} />
        </Suspense>

        <SectionHeader
          title="Price alerts"
          description="Fire when the price crosses your threshold and you visit the symbol"
        />
        <Suspense fallback={<AlertsSkeleton />}>
          <AlertsSection />
        </Suspense>
      </CardStack>
    </PageContainer>
  )
}

async function WatchlistContent({ requestedId }: { requestedId?: string }) {
  const watchlists = await listAllWatchlists()

  if (watchlists.length === 0) {
    return (
      <CardStack>
        <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span
            aria-hidden
            className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary"
          >
            <Star className="size-6" />
          </span>
          <h2 className="text-lg font-medium">Nothing here yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Open a stock detail page and tap the <strong>Watchlist</strong>{' '}
            star to start tracking it.
          </p>
          <Link href="/stocks/AAPL">
            <Button>Try AAPL</Button>
          </Link>
        </CardContent>
      </Card>
      </CardStack>
    )
  }

  const activeWl =
    watchlists.find((w) => w.id === requestedId) ?? watchlists[0]
  const items = await listWatchlistItems(activeWl.id)

  const enriched: EnrichedItem[] = await Promise.all(
    items.map(async (item) => {
      try {
        const [quote, profile] = await Promise.all([
          getQuote(item.symbol),
          getProfile(item.symbol),
        ])
        return { ...item, quote, profile, error: false }
      } catch {
        return { ...item, error: true }
      }
    })
  )

  return (
    <Card variant="list" className="gap-0">
      <WatchlistsTabs watchlists={watchlists} activeId={activeWl.id} />
      {enriched.length === 0 ? (
        <p className="text-sm text-center py-10 px-6 text-muted-foreground">
          “{activeWl.name}” is empty. Add stocks from any detail page using the
          watchlist star.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {enriched.map((item) => (
            <li key={item.symbol}>
              <WatchlistRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function WatchlistRow({ item }: { item: EnrichedItem }) {
  if (item.error || !item.quote || !item.profile) {
    return (
      <Link
        href={`/stocks/${item.symbol}`}
        className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary"
      >
        <span className="font-semibold tabular-nums">{item.symbol}</span>
        <Badge
          variant="outline"
          className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
        >
          Data unavailable
        </Badge>
      </Link>
    )
  }

  const logo = resolveLogo(item.profile)

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className={cn(
        'flex items-center gap-4 px-6 py-3 transition-colors',
        'hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary'
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="rounded-md object-contain bg-secondary shrink-0"
        />
      ) : (
        <div className="rounded-md flex items-center justify-center text-xs font-semibold shrink-0 w-9 h-9 bg-secondary text-muted-foreground">
          {item.symbol.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold tabular-nums">{item.symbol}</p>
        <p className="text-xs truncate text-muted-foreground">
          {item.profile.name}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold tabular-nums">{usd(item.quote.c)}</span>
        <ChangeBadge pct={item.quote.dp} size="xs" />
      </div>
    </Link>
  )
}
