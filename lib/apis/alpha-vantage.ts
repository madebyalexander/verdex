import { z } from 'zod'
import { redis } from '@/lib/cache'

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

function apiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key) throw new Error('ALPHA_VANTAGE_API_KEY missing in .env.local')
  return key
}

const DailyBarSchema = z.object({
  '1. open': z.string(),
  '2. high': z.string(),
  '3. low': z.string(),
  '4. close': z.string(),
  '5. volume': z.string(),
})

const DailyResponseSchema = z.object({
  'Time Series (Daily)': z.record(z.string(), DailyBarSchema).optional(),
  'Error Message': z.string().optional(),
  Note: z.string().optional(),
  Information: z.string().optional(),
})

export type OhlcvBar = {
  time: string // YYYY-MM-DD — lightweight-charts accepts this directly
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export class AlphaVantageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AlphaVantageError'
  }
}

/**
 * Thrown specifically when the Alpha Vantage free-tier daily quota (25/day)
 * is exhausted and we have no stale fallback data. Consumers should render
 * a friendly "try again later" state rather than the raw API message.
 */
export class AlphaVantageRateLimitError extends AlphaVantageError {
  constructor() {
    super(
      "Alpha Vantage's free-tier daily quota is exhausted. Charts and indicators will resume tomorrow."
    )
    this.name = 'AlphaVantageRateLimitError'
  }
}

// Fresh hits are good for 1 hour. After that we re-fetch — but if the API is
// rate-limited we serve from a longer-lived stale cache.
const FRESH_TTL_SECONDS = 60 * 60
const STALE_TTL_SECONDS = 60 * 60 * 24 * 7
// Once we detect a rate-limit, refuse to hit Alpha Vantage again for an hour.
// This stops the app from burning every page load on quota-exhausted responses
// (which Alpha Vantage still counts against the daily limit).
const RATELIMIT_BACKOFF_SECONDS = 60 * 60
const RATELIMIT_FLAG_KEY = 'av:ratelimited'

function freshKey(symbol: string) {
  return `av:daily:fresh:${symbol}`
}
function staleKey(symbol: string) {
  return `av:daily:stale:${symbol}`
}

export async function getDailyOhlcv(symbol: string): Promise<OhlcvBar[]> {
  // 1. Fresh cache hit — happy path.
  const fresh = await redis.get<OhlcvBar[]>(freshKey(symbol))
  if (fresh && fresh.length > 0) return fresh

  // 2. If a recent call hit the rate limit, skip Alpha Vantage entirely and
  //    serve stale data if we have any. Avoids re-burning quota responses.
  const rateLimited = await redis.get<string>(RATELIMIT_FLAG_KEY)
  if (rateLimited) {
    const stale = await redis.get<OhlcvBar[]>(staleKey(symbol))
    if (stale && stale.length > 0) return stale
    throw new AlphaVantageRateLimitError()
  }

  // 3. Try a fresh fetch.
  let bars: OhlcvBar[]
  try {
    bars = await fetchDailyFromAlphaVantage(symbol)
  } catch (err) {
    if (err instanceof AlphaVantageRateLimitError) {
      // Set the global backoff flag and try to serve stale.
      await redis.set(RATELIMIT_FLAG_KEY, '1', {
        ex: RATELIMIT_BACKOFF_SECONDS,
      })
      const stale = await redis.get<OhlcvBar[]>(staleKey(symbol))
      if (stale && stale.length > 0) return stale
      throw err
    }
    throw err
  }

  // 4. Cache primary (1h) and refresh stale (7d).
  await Promise.all([
    redis.set(freshKey(symbol), bars, { ex: FRESH_TTL_SECONDS }),
    redis.set(staleKey(symbol), bars, { ex: STALE_TTL_SECONDS }),
  ])
  return bars
}

async function fetchDailyFromAlphaVantage(
  symbol: string
): Promise<OhlcvBar[]> {
  const url = new URL(ALPHA_VANTAGE_BASE)
  url.searchParams.set('function', 'TIME_SERIES_DAILY')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('outputsize', 'compact') // ~100 most recent days
  url.searchParams.set('apikey', apiKey())

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new AlphaVantageError(`Alpha Vantage ${res.status}`)
  }
  const parsed = DailyResponseSchema.parse(await res.json())

  // Alpha Vantage returns HTTP 200 with `Note` or `Information` on rate limit,
  // and `Error Message` on unknown symbol / bad request.
  if (parsed.Note || parsed.Information) {
    throw new AlphaVantageRateLimitError()
  }
  if (parsed['Error Message']) {
    throw new AlphaVantageError(parsed['Error Message'])
  }

  const series = parsed['Time Series (Daily)']
  if (!series) {
    throw new AlphaVantageError('No time series data returned')
  }

  return Object.entries(series)
    .map(([date, bar]) => ({
      time: date,
      open: parseFloat(bar['1. open']),
      high: parseFloat(bar['2. high']),
      low: parseFloat(bar['3. low']),
      close: parseFloat(bar['4. close']),
      volume: parseInt(bar['5. volume'], 10),
    }))
    .sort((a, b) => a.time.localeCompare(b.time)) // asc — required by lightweight-charts
}
