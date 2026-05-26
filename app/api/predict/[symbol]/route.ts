import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { aiRefreshRatelimit } from '@/lib/ratelimit'
import {
  getCachedForecast,
  generateFreshForecast,
} from '@/lib/forecast'
import { UnknownSymbolError } from '@/lib/apis/finnhub'
import { GEMINI_MODEL } from '@/lib/apis/gemini'

const SymbolSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Symbol must be 1–10 uppercase chars')

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> }
) {
  const { symbol: raw } = await ctx.params
  const symbol = raw?.trim().toUpperCase() ?? ''

  const parsed = SymbolSchema.safeParse(symbol)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid symbol' },
      { status: 400 }
    )
  }

  // Auth required — AI forecasts are expensive
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // ?refresh=1 bypasses cache and forces a fresh Gemini call (still
  // ratelimited so this can't be abused). Useful after data sources change.
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1'

  if (!forceRefresh) {
    // Cache hits don't count against the rate limit (cheap to serve)
    const cached = await getCachedForecast(symbol)
    if (cached) {
      return NextResponse.json({
        symbol,
        forecast: cached,
        source: 'cache',
        generated_at: null,
        model: GEMINI_MODEL,
      })
    }
  }

  // Per-user fresh-forecast limit: 10 / hour (SPEC §11)
  const { success } = await aiRefreshRatelimit.limit(user.id)
  if (!success) {
    return NextResponse.json(
      { error: 'AI forecast rate limit exceeded — try again later' },
      { status: 429 }
    )
  }

  try {
    const result = await generateFreshForecast(symbol)
    return NextResponse.json({ symbol, ...result })
  } catch (err) {
    if (err instanceof UnknownSymbolError) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    }
    console.error('[/api/predict/[symbol]]', err)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 502 }
    )
  }
}
