import { NextRequest, NextResponse } from 'next/server'
import { getInvestorConsensus } from '@/lib/investors-consensus'
import { generalRatelimit } from '@/lib/ratelimit'

// The cold pass fetches every fund's 13F; allow extra time before the cache warms.
export const maxDuration = 60

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

  try {
    const consensus = await getInvestorConsensus()
    return NextResponse.json(consensus)
  } catch (err) {
    console.error('[/api/investors/consensus]', err)
    return NextResponse.json(
      { error: 'Failed to build consensus from SEC filings.' },
      { status: 502 }
    )
  }
}
