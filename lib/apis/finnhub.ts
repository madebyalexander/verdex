import { z } from 'zod'
import { cache } from '@/lib/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error('FINNHUB_API_KEY missing in .env.local')
  return key
}

// ---------------------------------------------------------------------
// /search — symbol lookup (15 min TTL per ARCHITECTURE §10)
// ---------------------------------------------------------------------

const FinnhubSearchSchema = z.object({
  count: z.number(),
  result: z.array(
    z.object({
      description: z.string(),
      displaySymbol: z.string(),
      symbol: z.string(),
      type: z.string(),
    })
  ),
})

export type FinnhubSearchResult = z.infer<typeof FinnhubSearchSchema>

export async function searchSymbols(query: string): Promise<FinnhubSearchResult> {
  const normalized = query.trim().toLowerCase()
  return cache(`finnhub:search:${normalized}`, 900, async () => {
    const url = new URL(`${FINNHUB_BASE}/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Finnhub /search ${res.status}: ${await res.text()}`)
    }
    return FinnhubSearchSchema.parse(await res.json())
  })
}

// ---------------------------------------------------------------------
// /quote — real-time quote (15s TTL per ARCHITECTURE §10)
// ---------------------------------------------------------------------

const FinnhubQuoteSchema = z.object({
  c: z.number(),         // current price
  d: z.number().nullable(),   // change
  dp: z.number().nullable(),  // change percent
  h: z.number(),         // high of day
  l: z.number(),         // low of day
  o: z.number(),         // open of day
  pc: z.number(),        // previous close
  t: z.number(),         // unix timestamp (seconds)
})

export type FinnhubQuote = z.infer<typeof FinnhubQuoteSchema>

export class UnknownSymbolError extends Error {
  constructor(symbol: string) {
    super(`Unknown symbol: ${symbol}`)
    this.name = 'UnknownSymbolError'
  }
}

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  return cache(`finnhub:quote:${symbol}`, 15, async () => {
    const url = new URL(`${FINNHUB_BASE}/quote`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Finnhub /quote ${res.status}: ${await res.text()}`)
    }
    const data = FinnhubQuoteSchema.parse(await res.json())
    // Finnhub returns t=0 and c=0 for unknown symbols rather than 404
    if (data.t === 0) throw new UnknownSymbolError(symbol)
    return data
  })
}

// ---------------------------------------------------------------------
// /company-news — per-symbol news (30 min TTL per ARCHITECTURE §10)
// ---------------------------------------------------------------------

const FinnhubNewsArticleSchema = z.object({
  category: z.string().optional(),
  datetime: z.number(),
  headline: z.string(),
  id: z.number(),
  image: z.string().optional(),
  related: z.string().optional(),
  source: z.string().optional(),
  summary: z.string().optional(),
  url: z.string(),
})

export type FinnhubNewsArticle = z.infer<typeof FinnhubNewsArticleSchema>

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getCompanyNews(
  symbol: string,
  days = 30
): Promise<FinnhubNewsArticle[]> {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - days)
  const fromStr = ymd(from)
  const toStr = ymd(to)

  return cache(
    `finnhub:news:${symbol}:${days}d:${toStr}`,
    1800, // 30 min
    async () => {
      const url = new URL(`${FINNHUB_BASE}/company-news`)
      url.searchParams.set('symbol', symbol)
      url.searchParams.set('from', fromStr)
      url.searchParams.set('to', toStr)
      url.searchParams.set('token', apiKey())

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(
          `Finnhub /company-news ${res.status}: ${await res.text()}`
        )
      }
      const raw = await res.json()
      if (!Array.isArray(raw)) return []
      // Finnhub returns an unbounded array — keep newest 50 to bound payload size
      return z
        .array(FinnhubNewsArticleSchema)
        .parse(raw)
        .sort((a, b) => b.datetime - a.datetime)
        .slice(0, 50)
    }
  )
}

// ---------------------------------------------------------------------
// /calendar/earnings — upcoming earnings releases (24h TTL)
// ---------------------------------------------------------------------

const FinnhubEarningsItemSchema = z.object({
  date: z.string(),
  epsActual: z.number().nullable(),
  epsEstimate: z.number().nullable(),
  hour: z.string().optional(),
  quarter: z.number().optional(),
  revenueActual: z.number().nullable(),
  revenueEstimate: z.number().nullable(),
  symbol: z.string(),
  year: z.number().optional(),
})

const FinnhubEarningsResponseSchema = z.object({
  earningsCalendar: z.array(FinnhubEarningsItemSchema).optional(),
})

export type FinnhubEarningsItem = z.infer<typeof FinnhubEarningsItemSchema>

export async function getUpcomingEarnings(
  symbol: string,
  daysAhead = 90
): Promise<FinnhubEarningsItem[]> {
  const from = new Date()
  const to = new Date()
  to.setDate(from.getDate() + daysAhead)

  return cache(
    `finnhub:earnings:${symbol}:${daysAhead}d`,
    24 * 3600,
    async () => {
      const url = new URL(`${FINNHUB_BASE}/calendar/earnings`)
      url.searchParams.set('symbol', symbol)
      url.searchParams.set('from', ymd(from))
      url.searchParams.set('to', ymd(to))
      url.searchParams.set('token', apiKey())

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(
          `Finnhub /calendar/earnings ${res.status}: ${await res.text()}`
        )
      }
      const parsed = FinnhubEarningsResponseSchema.parse(await res.json())
      return (parsed.earningsCalendar ?? []).sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    }
  )
}

// ---------------------------------------------------------------------
// /stock/recommendation — analyst buy/hold/sell trends (24h TTL per ARCHITECTURE §10)
// ---------------------------------------------------------------------

const FinnhubRecommendationSchema = z.object({
  buy: z.number(),
  hold: z.number(),
  period: z.string(),
  sell: z.number(),
  strongBuy: z.number(),
  strongSell: z.number(),
  symbol: z.string(),
})

export type FinnhubRecommendation = z.infer<typeof FinnhubRecommendationSchema>

export async function getRecommendations(
  symbol: string
): Promise<FinnhubRecommendation[]> {
  return cache(`finnhub:recs:${symbol}`, 24 * 3600, async () => {
    const url = new URL(`${FINNHUB_BASE}/stock/recommendation`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(
        `Finnhub /stock/recommendation ${res.status}: ${await res.text()}`
      )
    }
    const raw = await res.json()
    if (!Array.isArray(raw)) return []
    // Sort newest first (Finnhub usually returns ascending)
    return z
      .array(FinnhubRecommendationSchema)
      .parse(raw)
      .sort((a, b) => b.period.localeCompare(a.period))
  })
}

// ---------------------------------------------------------------------
// /stock/insider-transactions — last 90d (6h TTL per ARCHITECTURE §10)
// ---------------------------------------------------------------------

const FinnhubInsiderTxSchema = z.object({
  name: z.string(),
  share: z.number().nullable().optional(),
  change: z.number().nullable().optional(),
  filingDate: z.string().optional(),
  transactionDate: z.string().optional(),
  transactionCode: z.string().optional(),
  transactionPrice: z.number().nullable().optional(),
  currency: z.string().optional(),
})

const FinnhubInsiderResponseSchema = z.object({
  data: z.array(FinnhubInsiderTxSchema).optional(),
  symbol: z.string().optional(),
})

export type FinnhubInsiderTx = z.infer<typeof FinnhubInsiderTxSchema>

export async function getInsiderTransactions(
  symbol: string,
  days = 90
): Promise<FinnhubInsiderTx[]> {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - days)

  return cache(
    `finnhub:insiders:${symbol}:${days}d`,
    6 * 3600,
    async () => {
      const url = new URL(`${FINNHUB_BASE}/stock/insider-transactions`)
      url.searchParams.set('symbol', symbol)
      url.searchParams.set('from', ymd(from))
      url.searchParams.set('to', ymd(to))
      url.searchParams.set('token', apiKey())

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(
          `Finnhub /stock/insider-transactions ${res.status}: ${await res.text()}`
        )
      }
      const parsed = FinnhubInsiderResponseSchema.parse(await res.json())
      return parsed.data ?? []
    }
  )
}

// ---------------------------------------------------------------------
// /stock/metric — fundamentals (24h TTL per ARCHITECTURE §10)
// Returns ~100 raw fields. We pass the whole object to Claude and let it
// pick what informs the forecast.
// ---------------------------------------------------------------------

const FinnhubMetricResponseSchema = z
  .object({
    metric: z
      .record(
        z.string(),
        z.union([z.number(), z.string(), z.null()])
      )
      .optional(),
  })
  .passthrough()

export type FinnhubMetrics = Record<string, number | string | null>

export async function getStockMetrics(
  symbol: string
): Promise<FinnhubMetrics | null> {
  return cache(`finnhub:metric:${symbol}`, 24 * 3600, async () => {
    const url = new URL(`${FINNHUB_BASE}/stock/metric`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('metric', 'all')
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(
        `Finnhub /stock/metric ${res.status}: ${await res.text()}`
      )
    }
    const parsed = FinnhubMetricResponseSchema.parse(await res.json())
    return parsed.metric ?? null
  })
}

// ---------------------------------------------------------------------
// /stock/profile2 — company profile + logo (7d TTL Redis + Postgres mirror)
// ---------------------------------------------------------------------

const FinnhubProfileSchema = z.object({
  country: z.string().optional(),
  currency: z.string().optional(),
  exchange: z.string().optional(),
  finnhubIndustry: z.string().optional(),
  ipo: z.string().optional(),
  logo: z.string().optional(),
  marketCapitalization: z.number().optional(),
  name: z.string(),
  phone: z.string().optional(),
  shareOutstanding: z.number().optional(),
  ticker: z.string(),
  weburl: z.string().optional(),
})

export type FinnhubProfile = z.infer<typeof FinnhubProfileSchema>

const PROFILE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export async function getProfile(symbol: string): Promise<FinnhubProfile> {
  return cache(`finnhub:profile:${symbol}`, PROFILE_TTL_SECONDS, async () => {
    const url = new URL(`${FINNHUB_BASE}/stock/profile2`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Finnhub /stock/profile2 ${res.status}: ${await res.text()}`)
    }
    const raw = await res.json()
    // Finnhub returns an empty object for unknown symbols
    if (!raw || typeof raw !== 'object' || !('name' in raw)) {
      throw new UnknownSymbolError(symbol)
    }
    const profile = FinnhubProfileSchema.parse(raw)

    // Mirror to Postgres for durability (ARCHITECTURE §10). Failure here is logged
    // but doesn't break the Redis cache write or the user response.
    const { error: upsertError } = await supabaseAdmin
      .from('stock_metadata')
      .upsert({ symbol, profile, fetched_at: new Date().toISOString() })
    if (upsertError) {
      console.error('[stock_metadata upsert]', upsertError.message)
    }

    return profile
  })
}

// ---------------------------------------------------------------------
// /stock/market-status — US session state (1 min TTL, same as indices)
// ---------------------------------------------------------------------

const FinnhubMarketStatusSchema = z.object({
  exchange: z.string(),
  holiday: z.string().nullable().optional(),
  isOpen: z.boolean(),
  session: z.string().nullable().optional(),
  timezone: z.string().optional(),
  t: z.number(),
})

export type FinnhubMarketStatus = z.infer<typeof FinnhubMarketStatusSchema>

export async function getMarketStatus(): Promise<FinnhubMarketStatus> {
  return cache('finnhub:market-status:US', 60, async () => {
    const url = new URL(`${FINNHUB_BASE}/stock/market-status`)
    url.searchParams.set('exchange', 'US')
    url.searchParams.set('token', apiKey())

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(
        `Finnhub /stock/market-status ${res.status}: ${await res.text()}`
      )
    }
    return FinnhubMarketStatusSchema.parse(await res.json())
  })
}
