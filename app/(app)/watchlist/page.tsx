import { Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ChangeText } from '@/components/ui/change-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { StockLogo } from '@/components/ui/stock-logo'
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

import { compactUsd, usd } from '@/lib/format'
import { RangeBar } from '@/components/ui/range-bar'
import { IoStar as Star, IoChevronForward as ChevronRight } from 'react-icons/io5'

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
    <PageContainer>
      <PageHeader
        icon={Star}
        title="Watchlist"
        description="The stocks you follow and the price alerts you've set"
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start lg:gap-6">
        <div className="min-w-0 lg:col-span-2">
          <Suspense key={requestedId ?? '_'} fallback={<WatchlistSkeleton />}>
            <WatchlistContent requestedId={requestedId} />
          </Suspense>
        </div>
        <section className="flex flex-col gap-4 lg:sticky lg:top-20">
          <SectionHeader
            title="Price alerts"
            description="Checked when you open the stock — fires once the price crosses your target"
          />
          <Suspense fallback={<AlertsSkeleton />}>
            <AlertsSection />
          </Suspense>
        </section>
      </div>
    </PageContainer>
  )
}

async function WatchlistContent({ requestedId }: { requestedId?: string }) {
  const watchlists = await listAllWatchlists()

  if (watchlists.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Star}
          title="Build your first watchlist"
          description="Follow the stocks you care about and see their moves at a glance. Tap Watch on any stock page to add it here."
          action={
            <>
              <Link href="/market" className={buttonVariants({ size: 'lg' })}>
                Browse markets
              </Link>
              <Link
                href="/stocks/AAPL"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Start with AAPL
              </Link>
            </>
          }
        />
      </Card>
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
    <Card variant="list" className="gap-0 pt-4">
      <WatchlistsTabs watchlists={watchlists} activeId={activeWl.id} />
      {enriched.length === 0 ? (
        <EmptyState
          icon={Star}
          tone="muted"
          title={`“${activeWl.name}” is empty`}
          description="Open any stock and tap Watch to add it to this list."
          action={
            <Link href="/market" className={buttonVariants({ variant: 'outline' })}>
              Browse markets
            </Link>
          }
          className="py-10"
        />
      ) : (
        <>
        <div className="hidden grid-cols-[1.3fr_1fr_5.5rem_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid lg:grid-cols-[1.3fr_1fr_5.5rem_7rem_auto]">
          <span>Stock</span>
          <span>Day range</span>
          <span className="hidden text-right lg:block">Mkt cap</span>
          <span className="text-right">Price</span>
          <span className="w-4" aria-hidden />
        </div>
        <ul className="divide-y divide-border">
          {enriched.map((item) => (
            <li key={item.symbol}>
              <WatchlistRow item={item} />
            </li>
          ))}
        </ul>
        </>
      )}
    </Card>
  )
}

function WatchlistRow({ item }: { item: EnrichedItem }) {
  if (item.error || !item.quote || !item.profile) {
    return (
      <Link
        href={`/stocks/${item.symbol}`}
        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:bg-white/[0.04]"
      >
        <StockLogo
          symbol={item.symbol}
          className="size-10 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
        />
        <span className="flex-1 font-semibold tabular-nums">{item.symbol}</span>
        <Badge
          variant="outline"
          className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
        >
          Data unavailable
        </Badge>
      </Link>
    )
  }

  const { quote, profile } = item
  const capUsd = (profile.marketCapitalization ?? 0) * 1_000_000
  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.04] focus-visible:outline-none md:grid-cols-[1.3fr_1fr_5.5rem_auto] lg:grid-cols-[1.3fr_1fr_5.5rem_7rem_auto]"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <StockLogo
          symbol={item.symbol}
          src={profile.logo || null}
          className="size-10 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
        />
        <div className="min-w-0">
          <p className="font-semibold tabular-nums transition-colors group-hover:text-primary">
            {item.symbol}
          </p>
          <p className="truncate text-xs text-muted-foreground">{profile.name}</p>
        </div>
      </div>
      <div className="hidden md:block">
        <RangeBar low={quote.l} high={quote.h} value={quote.c} />
      </div>
      <p className="hidden text-right text-sm tabular-nums text-muted-foreground lg:block">
        {capUsd > 0 ? compactUsd(capUsd) : '—'}
      </p>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-semibold tabular-nums">{usd(quote.c)}</span>
        <ChangeText pct={quote.dp} abs={quote.d} showIcon={false} className="text-xs" />
      </div>
      <ChevronRight
        aria-hidden
        className="hidden size-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-foreground md:block"
      />
    </Link>
  )
}
