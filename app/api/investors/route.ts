import { NextRequest, NextResponse } from 'next/server'
import { getFund13F } from '@/lib/apis/sec'
import { investorByCik, INVESTORS } from '@/lib/investors'
import { generalRatelimit } from '@/lib/ratelimit'

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

  const cik = req.nextUrl.searchParams.get('cik') ?? ''
  const investor = investorByCik(cik) ?? INVESTORS[0]

  try {
    const fund = await getFund13F(investor.cik)
    if (!fund) {
      return NextResponse.json(
        { error: 'No 13F filing found for this fund.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ investor, fund })
  } catch (err) {
    console.error('[/api/investors]', err)
    return NextResponse.json(
      { error: 'Failed to load filing data from SEC.' },
      { status: 502 }
    )
  }
}
