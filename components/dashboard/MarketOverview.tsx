'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  MarketTableHeader,
  StockRow,
  StockSkeletonRows,
} from '@/components/market/market-table'
import {
  MARKET_SECTORS,
  DEFAULT_MARKET_SECTOR,
  WATCHLIST_KEY,
  type MarketStock,
} from '@/lib/market-universe'
import { cn } from '@/lib/utils'
import { IoStar as Star } from 'react-icons/io5'

export function MarketOverview({ initialSector }: { initialSector?: string }) {
  const [sector, setSector] = useState(initialSector ?? DEFAULT_MARKET_SECTOR)
  const [stocks, setStocks] = useState<MarketStock[] | null>(null)
  const [loading, setLoading] = useState(true)
  const cache = useRef<Map<string, MarketStock[]>>(new Map())
  const reqId = useRef(0)

  useEffect(() => {
    const myReq = ++reqId.current
    const cached = cache.current.get(sector)
    if (cached) {
      setStocks(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/market?sector=${encodeURIComponent(sector)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { stocks: MarketStock[] }) => {
        if (myReq !== reqId.current) return
        cache.current.set(sector, data.stocks)
        setStocks(data.stocks)
      })
      .catch(() => {
        if (myReq === reqId.current) setStocks([])
      })
      .finally(() => {
        if (myReq === reqId.current) setLoading(false)
      })
  }, [sector])

  return (
    <div className="flex flex-col gap-3">
      {/* Watchlist + sector filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {[WATCHLIST_KEY, ...MARKET_SECTORS].map((s) => {
          const active = s === sector
          const isWatchlist = s === WATCHLIST_KEY
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
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

      <Card variant="list">
        <CardContent className="px-0">
          {/* Column header — same grid as the rows */}
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
              {stocks.map((stock) => (
                <li key={stock.symbol}>
                  <StockRow stock={stock} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
