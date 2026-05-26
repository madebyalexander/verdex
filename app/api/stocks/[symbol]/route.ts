import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getQuote,
  getProfile,
  UnknownSymbolError,
  type FinnhubProfile,
} from '@/lib/apis/finnhub'
import { generalRatelimit } from '@/lib/ratelimit'

const SymbolSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Symbol must be 1–10 uppercase chars')

function resolveLogo(profile: FinnhubProfile): string | null {
  if (profile.logo && profile.logo.length > 0) return profile.logo
  if (profile.weburl) {
    try {
      const host = new URL(profile.weburl).hostname.replace(/^www\./, '')
      return `https://logo.clearbit.com/${host}`
    } catch {
      // invalid weburl, fall through
    }
  }
  return null
}

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

  try {
    const [quote, profile] = await Promise.all([
      getQuote(symbol),
      getProfile(symbol),
    ])
    return NextResponse.json({
      symbol,
      quote,
      profile: { ...profile, resolvedLogo: resolveLogo(profile) },
    })
  } catch (err) {
    if (err instanceof UnknownSymbolError) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    }
    console.error('[/api/stocks/[symbol]]', err)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 502 }
    )
  }
}
