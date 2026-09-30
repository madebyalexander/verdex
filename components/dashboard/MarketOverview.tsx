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
import { FilterChip, ChipRow } from '@/components/ui/filter-chip'
import { EmptyState } from '@/components/ui/empty-state'
import { IoStar as Star, IoWarning as Warning } from 'react-icons/io5'

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
      <ChipRow role="toolbar" aria-label="Filter by watchlist or sector">
        {[WATCHLIST_KEY, ...MARKET_SECTORS].map((s) => (
          <FilterChip key={s} active={s === sector} onClick={() => setSector(s)}>
            {s === WATCHLIST_KEY && <Star aria-hidden className="size-3" />}
            {s}
          </FilterChip>
        ))}
      </ChipRow>

      <Card variant="list">
        <CardContent className="px-0">
          {/* Column header — same grid as the rows */}
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
