import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listWatchlistItems } from '@/lib/watchlist'
import { getQuote, getProfile } from '@/lib/apis/finnhub'
import { toCsv, csvResponseHeaders } from '@/lib/csv'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const items = await listWatchlistItems()

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [quote, profile] = await Promise.all([
        getQuote(item.symbol).catch(() => null),
        getProfile(item.symbol).catch(() => null),
      ])
      return { ...item, quote, profile }
    })
  )

  const rows: unknown[][] = [
    [
      'Symbol',
      'Name',
      'Sector',
      'Current Price',
      'Change',
      'Change %',
      'Added At',
    ],
    ...enriched.map((i) => [
      i.symbol,
      i.profile?.name ?? '',
      i.profile?.finnhubIndustry ?? '',
      i.quote?.c ?? '',
      i.quote?.d ?? '',
      i.quote?.dp != null ? i.quote.dp.toFixed(2) : '',
      i.added_at,
    ]),
  ]

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(rows), {
    headers: csvResponseHeaders(`verdex-watchlist-${date}.csv`),
  })
}
