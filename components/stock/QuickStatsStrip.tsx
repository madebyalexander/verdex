import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RangeBar } from '@/components/ui/range-bar'
import { InfoTip } from '@/components/ui/info-tip'
import type { GlossaryKey } from '@/lib/glossary'
import { getStockMetrics, type FinnhubQuote } from '@/lib/apis/finnhub'
import { compactNum, compactUsd, usd } from '@/lib/format'

function n(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** "Key statistics" panel beside the price chart. */
export async function QuickStatsStrip({
  symbol,
  quote,
  marketCapUsd,
}: {
  symbol: string
  quote: FinnhubQuote
  marketCapUsd: number
}) {
  let metrics: Awaited<ReturnType<typeof getStockMetrics>> = null
  try {
    metrics = await getStockMetrics(symbol)
  } catch {
    metrics = null
  }

  const high52 = n(metrics?.['52WeekHigh'])
  const low52 = n(metrics?.['52WeekLow'])
  const pe =
    n(metrics?.peTTM) ??
    n(metrics?.peNormalizedAnnual) ??
    n(metrics?.peExclExtraTTM)
  const eps = n(metrics?.epsTTM)
  const divYield = n(metrics?.dividendYieldIndicatedAnnual)
  const beta = n(metrics?.beta)
  // Finnhub reports average volume in millions of shares.
  const avgVolM = n(metrics?.['10DayAverageTradingVolume'])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Key statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-2">
          <Stat label="Open" value={usd(quote.o)} />
          <Stat label="Prev close" info="prevClose" value={usd(quote.pc)} />
          <Stat
            label="Market cap"
            info="marketCap"
            value={marketCapUsd > 0 ? compactUsd(marketCapUsd) : '—'}
          />
          <Stat label="P/E ratio" info="pe" value={pe != null ? pe.toFixed(1) : '—'} />
          <Stat label="EPS (TTM)" info="eps" value={eps != null ? usd(eps) : '—'} />
          <Stat
            label="Dividend yield"
            info="dividendYield"
            value={divYield != null && divYield > 0 ? `${divYield.toFixed(2)}%` : '—'}
          />
          <Stat label="Beta" info="beta" value={beta != null ? beta.toFixed(2) : '—'} />
          <Stat
            label="Avg volume"
            info="avgVolume"
            value={avgVolM != null ? compactNum(avgVolM * 1_000_000) : '—'}
          />
        </dl>
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-1">
          <RangeBar
            label="Day range"
            info="dayRange"
            low={quote.l}
            high={quote.h}
            value={quote.c}
          />
          <RangeBar
            label="52-week range"
            info="week52Range"
            low={low52}
            high={high52}
            value={quote.c}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  info,
}: {
  label: string
  value: string
  info?: GlossaryKey
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {info && <InfoTip term={info} />}
      </dt>
      <dd className="truncate text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
