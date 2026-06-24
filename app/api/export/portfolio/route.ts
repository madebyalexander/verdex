import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listPositions } from '@/lib/portfolio'
import { getQuote } from '@/lib/apis/finnhub'
import { toCsv, csvResponseHeaders } from '@/lib/csv'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const positions = await listPositions()

  const enriched = await Promise.all(
    positions.map(async (p) => {
      const quote = await getQuote(p.symbol).catch(() => null)
      return { ...p, quote }
    })
  )

  const rows: unknown[][] = [
    [
      'Symbol',
      'Quantity',
      'Cost Basis ($/share)',
      'Total Cost',
      'Current Price',
      'Current Value',
      'P/L Absolute',
      'P/L %',
      'Opened At',
    ],
    ...enriched.map((p) => {
      const qty = Number(p.quantity)
      const cb = Number(p.cost_basis)
      const cost = qty * cb
      const value = p.quote ? qty * p.quote.c : null
      const pl = value != null ? value - cost : null
      const plPct = cost > 0 && pl != null ? (pl / cost) * 100 : null
      return [
        p.symbol,
        qty,
        cb,
        cost.toFixed(2),
        p.quote?.c ?? '',
        value != null ? value.toFixed(2) : '',
        pl != null ? pl.toFixed(2) : '',
        plPct != null ? plPct.toFixed(2) : '',
        p.opened_at,
      ]
    }),
  ]

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(rows), {
    headers: csvResponseHeaders(`verdex-portfolio-${date}.csv`),
  })
}
