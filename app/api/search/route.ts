import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchSymbols } from '@/lib/apis/finnhub'
import { generalRatelimit } from '@/lib/ratelimit'

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
})

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: req.nextUrl.searchParams.get('q') ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Query must be 1–80 characters' },
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
    const data = await searchSymbols(parsed.data.q)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/search]', err)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 502 }
    )
  }
}
