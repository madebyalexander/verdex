import { NextRequest, NextResponse } from 'next/server'
import { getQuote, getProfile, getStockMetrics } from '@/lib/apis/finnhub'
import { generalRatelimit } from '@/lib/ratelimit'
import { MARKET_FEED_SYMBOLS, type MarketStock } from '@/lib/market-universe'

const PAGE = 20

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

  const offset = Math.max(
    0,
    Number.parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10) || 0
  )
  const slice = MARKET_FEED_SYMBOLS.slice(offset, offset + PAGE)

  // Finnhub only (quote + profile + metrics). No Alpha Vantage sparkline at
  // this scale, so `closes` is empty and the 30d-trend column renders blank.
  const stocks: MarketStock[] = await Promise.all(
    slice.map(async (symbol) => {
      const [quote, profile, metrics] = await Promise.all([
        getQuote(symbol).catch(() => null),
        getProfile(symbol).catch(() => null),
        getStockMetrics(symbol).catch(() => null),
      ])
      return {
        symbol,
        name: profile?.name ?? symbol,
        price: quote?.c ?? null,
        changePct: quote?.dp ?? null,
        marketCap: profile?.marketCapitalization
          ? profile.marketCapitalization * 1_000_000
          : null,
        pe:
          num(metrics?.peTTM) ??
          num(metrics?.peNormalizedAnnual) ??
          num(metrics?.peExclExtraTTM),
        week52High: num(metrics?.['52WeekHigh']),
        week52Low: num(metrics?.['52WeekLow']),
        closes: [],
      }
    })
  )

  const nextOffset =
    offset + PAGE < MARKET_FEED_SYMBOLS.length ? offset + PAGE : null

  return NextResponse.json({ stocks, nextOffset })
}
