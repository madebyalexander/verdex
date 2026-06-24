import { NextRequest, NextResponse } from 'next/server'
import { getQuote, getProfile, getStockMetrics } from '@/lib/apis/finnhub'
import { getDailyOhlcv } from '@/lib/apis/alpha-vantage'
import { generalRatelimit } from '@/lib/ratelimit'
import { listWatchlistItems } from '@/lib/watchlist'
import {
  MARKET_UNIVERSE,
  WATCHLIST_KEY,
  type MarketStock,
} from '@/lib/market-universe'

function num(v: number | string | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  const { success } = await generalRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — try again in a minute' },
      { status: 429 }
    )
  }

  const requested = req.nextUrl.searchParams.get('sector') ?? ''

  let sector: string
  let symbols: string[]
  if (requested === WATCHLIST_KEY) {
    sector = WATCHLIST_KEY
    const items = await listWatchlistItems()
    // Cap to keep the per-view fetch (and Alpha Vantage sparkline calls) bounded.
    symbols = items.slice(0, 20).map((i) => i.symbol)
  } else if (requested in MARKET_UNIVERSE) {
    sector = requested
    symbols = MARKET_UNIVERSE[sector]
  } else {
    sector = WATCHLIST_KEY
    const items = await listWatchlistItems()
    symbols = items.slice(0, 20).map((i) => i.symbol)
  }

  if (symbols.length === 0) {
    return NextResponse.json({ sector, stocks: [] })
  }

  const stocks: MarketStock[] = await Promise.all(
    symbols.map(async (symbol) => {
      const [quote, profile, metrics, bars] = await Promise.all([
        getQuote(symbol).catch(() => null),
        getProfile(symbol).catch(() => null),
        getStockMetrics(symbol).catch(() => null),
        getDailyOhlcv(symbol).catch(() => []),
      ])
      return {
        symbol,
        name: profile?.name ?? symbol,
        price: quote ? quote.c : null,
        changePct: quote ? quote.dp : null,
        // Finnhub returns market cap in millions.
        marketCap: profile?.marketCapitalization
          ? profile.marketCapitalization * 1_000_000
          : null,
        pe: num(metrics?.peTTM),
        week52High: num(metrics?.['52WeekHigh']),
        week52Low: num(metrics?.['52WeekLow']),
        closes: bars.slice(-30).map((b) => b.close),
      }
    })
  )

  return NextResponse.json({ sector, stocks })
}
