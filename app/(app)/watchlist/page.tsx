import Link from 'next/link'
import { Download, Star } from 'lucide-react'
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
import { PageHeader } from '@/components/layout/PageHeader'

import { usd } from '@/lib/format'

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
  const watchlists = await listAllWatchlists()

  if (watchlists.length === 0) {
    return (
      <main className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
        <PageHeader icon={Star} title="Watchlist" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span aria-hidden className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
              <Star className="size-6" />
            </span>
            <h2 className="text-lg font-medium">Nothing here yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open a stock detail page and tap the <strong>Watchlist</strong> star
              to start tracking it.
            </p>
            <Link href="/stocks/AAPL">
              <Button>Try AAPL</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
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
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon={Star}
        title="Watchlist"
        description={`${enriched.length} ${enriched.length === 1 ? 'stock' : 'stocks'} in this list`}
        action={
          <a
            href="/api/export/watchlist"
            download
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Download aria-hidden className="size-3.5" />
            <span>Export CSV</span>
          </a>
        }
      />

      <WatchlistsTabs watchlists={watchlists} activeId={activeWl.id} />

      {enriched.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-sm text-muted-foreground">
            “{activeWl.name}” is empty. Add stocks from any detail page using
            the “+ Watchlist” button (saves to your default list).
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {enriched.map((item) => (
            <WatchlistRow key={item.symbol} item={item} />
          ))}
        </div>
      )}
    </main>
  )
}

function WatchlistRow({ item }: { item: EnrichedItem }) {
  if (item.error || !item.quote || !item.profile) {
    return (
      <Link
        href={`/stocks/${item.symbol}`}
        className="block transition-opacity hover:opacity-90"
      >
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="font-semibold">{item.symbol}</span>
            <Badge
              variant="outline"
              className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
            >
              Data unavailable
            </Badge>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const logo = resolveLogo(item.profile)

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className="block transition-opacity hover:opacity-90"
    >
      <Card>
        <CardContent className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="rounded-md object-contain bg-secondary"
            />
          ) : (
            <div className="rounded-md flex items-center justify-center text-xs font-semibold shrink-0 w-9 h-9 bg-secondary text-muted-foreground">
              {item.symbol.slice(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{item.symbol}</p>
            <p className="text-xs truncate text-muted-foreground">
              {item.profile.name}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="font-semibold tabular-nums">{usd(item.quote.c)}</p>
            <ChangeBadge pct={item.quote.dp} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
