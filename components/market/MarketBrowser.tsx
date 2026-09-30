'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  MarketTableHeader,
  StockRow,
  StockSkeletonRows,
} from '@/components/market/market-table'
import { MarketFeed } from '@/components/market/MarketFeed'
import {
  MARKET_SECTORS,
  WATCHLIST_KEY,
  type MarketStock,
} from '@/lib/market-universe'
import { FilterChip, ChipRow } from '@/components/ui/filter-chip'
import { EmptyState } from '@/components/ui/empty-state'
import { IoStar as Star, IoWarning as Warning } from 'react-icons/io5'

const ALL_KEY = 'All'

export function MarketBrowser() {
  const [view, setView] = useState<string>(ALL_KEY)
  const chips = [ALL_KEY, WATCHLIST_KEY, ...MARKET_SECTORS]

  return (
    <div className="flex flex-col gap-5">
      <ChipRow role="toolbar" aria-label="Filter by watchlist or sector">
        {chips.map((s) => (
          <FilterChip key={s} active={s === view} onClick={() => setView(s)}>
            {s === WATCHLIST_KEY && <Star aria-hidden className="size-3" />}
            {s}
          </FilterChip>
        ))}
      </ChipRow>

      {view === ALL_KEY ? (
        <MarketFeed />
      ) : (
        <SectorTable key={view} sector={view} />
      )}
    </div>
  )
}

function SectorTable({ sector }: { sector: string }) {
  const [stocks, setStocks] = useState<MarketStock[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`/api/market?sector=${encodeURIComponent(sector)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { stocks: MarketStock[] }) => {
        if (active) setStocks(data.stocks)
      })
      .catch(() => {
        if (active) setStocks([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [sector])

  return (
    <Card variant="list">
      <CardContent className="px-0">
        <MarketTableHeader />
        {loading || stocks === null ? (
          <StockSkeletonRows />
        ) : stocks.length === 0 ? (
          <EmptyState
            icon={sector === WATCHLIST_KEY ? Star : Warning}
            tone={sector === WATCHLIST_KEY ? 'brand' : 'warning'}
            title={
              sector === WATCHLIST_KEY
                ? 'Your watchlist is empty'
                : `Couldn't load ${sector}`
            }
            description={
              sector === WATCHLIST_KEY
                ? 'Tap the star on any stock page to follow it here — or pick a sector above.'
                : 'The data provider may be rate-limiting. Try another sector or check back shortly.'
            }
            className="border-t border-border py-10"
          />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {stocks.map((s) => (
              <li key={s.symbol}>
                <StockRow stock={s} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
