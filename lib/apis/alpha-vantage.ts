import { z } from 'zod'
import { cache } from '@/lib/cache'

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

// 1h TTL — daily bars don't change often, but today's bar still updates during
// market hours. SPEC §10 spec'd 1h for technical indicators; same here.
const DAILY_TTL_SECONDS = 60 * 60

export async function getDailyOhlcv(symbol: string): Promise<OhlcvBar[]> {
  return cache(`av:daily:${symbol}`, DAILY_TTL_SECONDS, async () => {
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

    // Alpha Vantage returns 200 OK with these fields on error/rate limit
    if (parsed['Error Message']) {
      throw new AlphaVantageError(parsed['Error Message'])
    }
    if (parsed.Note || parsed.Information) {
      throw new AlphaVantageError(
        parsed.Note ??
          parsed.Information ??
          'Alpha Vantage rate limit hit (25/day, 5/min on free tier)'
      )
    }
    const series = parsed['Time Series (Daily)']
    if (!series) {
      throw new AlphaVantageError('No time series data returned')
    }

    const bars: OhlcvBar[] = Object.entries(series)
      .map(([date, bar]) => ({
        time: date,
        open: parseFloat(bar['1. open']),
        high: parseFloat(bar['2. high']),
        low: parseFloat(bar['3. low']),
        close: parseFloat(bar['4. close']),
        volume: parseInt(bar['5. volume'], 10),
      }))
      .sort((a, b) => a.time.localeCompare(b.time)) // ascending — required by lightweight-charts

    return bars
  })
}
