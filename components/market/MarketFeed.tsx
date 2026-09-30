'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MarketTableHeader,
  StockRow,
  StockSkeletonRows,
} from '@/components/market/market-table'
import type { MarketStock } from '@/lib/market-universe'

type Page = { stocks: MarketStock[]; nextOffset: number | null }

export function MarketFeed() {
  const [stocks, setStocks] = useState<MarketStock[]>([])
  const [offset, setOffset] = useState<number | null>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || offset === null) return
    loadingRef.current = true
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/market/feed?offset=${offset}`)
      if (!res.ok) throw new Error(String(res.status))
      const data: Page = await res.json()
      setStocks((prev) => [...prev, ...data.stocks])
      setOffset(data.nextOffset)
    } catch {
      setError(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [offset])

  // Load the first page on mount and each next page as the sentinel nears the
  // viewport. Paused while an error is showing so it doesn't auto-retry.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || offset === null || error) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '600px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [offset, error, loadMore])

  const done = offset === null

  return (
    <Card variant="list">
      <CardContent className="px-0">
        <MarketTableHeader trend={false} />

        {stocks.length === 0 && loading ? (
          <StockSkeletonRows count={12} trend={false} />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {stocks.map((stock) => (
              <li key={stock.symbol}>
                <StockRow stock={stock} trend={false} />
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
            <span>Couldn’t load more right now.</span>
            <Button size="sm" variant="outline" onClick={loadMore}>
              Retry
            </Button>
          </div>
        ) : !done ? (
          <div
            ref={sentinelRef}
            className="py-6 text-center text-sm text-muted-foreground"
          >
            {stocks.length > 0 ? 'Loading more…' : ''}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            That’s the whole list.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
