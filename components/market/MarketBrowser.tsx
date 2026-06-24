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
import { cn } from '@/lib/utils'
import { IoStar as Star } from 'react-icons/io5'

const ALL_KEY = 'All'

export function MarketBrowser() {
  const [view, setView] = useState<string>(ALL_KEY)
  const chips = [ALL_KEY, WATCHLIST_KEY, ...MARKET_SECTORS]

  return (
    <div className="flex flex-col gap-6">
      {/* Same filter chips as the dashboard Market overview, plus All */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((s) => {
          const active = s === view
          const isWatchlist = s === WATCHLIST_KEY
          return (
            <button
              key={s}
              type="button"
              onClick={() => setView(s)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium ring-1 ring-inset transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                active
                  ? 'bg-primary/10 text-primary ring-primary/30'
                  : 'bg-secondary text-muted-foreground ring-border hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              {isWatchlist && <Star aria-hidden className="size-3" />}
              {s}
            </button>
          )
        })}
      </div>

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
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {sector === WATCHLIST_KEY
              ? 'Your watchlist is empty. Add stocks from any detail page, or pick a sector above.'
              : `Couldn't load ${sector} stocks. Try another sector.`}
          </p>
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
