import { NextRequest, NextResponse } from 'next/server'
import { generateFreshForecast } from '@/lib/forecast'

// Pre-warms forecasts for popular tickers so first-of-day visitors don't pay
// the 5-15s generation wait. Costs ~$0.04 per ticker per run.
//
// NOT yet active — to enable, add to vercel.json:
//   {
//     "crons": [
//       { "path": "/api/cron/prewarm-predictions", "schedule": "0 4 * * *" }
//     ]
//   }
// (4am UTC = midnight ET, before pre-market). Set CRON_SECRET in Vercel env.

const POPULAR_TICKERS = [
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'TSLA',
  'META',
  'AMZN',
  'NFLX',
] as const

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const results = await Promise.allSettled(
    POPULAR_TICKERS.map(async (symbol) => {
      const result = await generateFreshForecast(symbol)
      return { symbol, source: result.source }
    })
  )

  return NextResponse.json({
    started_at: new Date(startedAt).toISOString(),
    elapsed_ms: Date.now() - startedAt,
    tickers: POPULAR_TICKERS,
    results: results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { symbol: POPULAR_TICKERS[i], error: String(r.reason) }
    ),
  })
}
