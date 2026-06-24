import { Card, CardContent } from '@/components/ui/card'
import { RangeBar } from '@/components/ui/range-bar'
import { InfoTip } from '@/components/ui/info-tip'
import type { GlossaryKey } from '@/lib/glossary'
import { getStockMetrics, type FinnhubQuote } from '@/lib/apis/finnhub'
import { compactUsd, usd } from '@/lib/format'

function n(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

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
  const peRaw =
    n(metrics?.peTTM) ??
    n(metrics?.peNormalizedAnnual) ??
    n(metrics?.peExclExtraTTM)
  const peLabel = peRaw != null ? peRaw.toFixed(1) : '—'

  return (
    <Card className="py-0">
      <CardContent className="my-0 flex flex-col gap-3 py-5">
        <dl className="grid grid-cols-3 sm:grid-cols-6 gap-y-2 sm:gap-y-0 sm:divide-x sm:divide-border">
          <Stat label="Open" value={usd(quote.o)} />
          <Stat label="High" value={usd(quote.h)} />
          <Stat label="Low" value={usd(quote.l)} />
          <Stat label="Prev close" info="prevClose" value={usd(quote.pc)} />
          <Stat
            label="Mkt cap"
            info="marketCap"
            value={marketCapUsd > 0 ? compactUsd(marketCapUsd) : '—'}
          />
          <Stat label="P/E" info="pe" value={peLabel} />
        </dl>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-3 border-t border-border/40">
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
    <div className="flex flex-col sm:items-center sm:px-3 first:pl-0 last:pr-0 leading-tight">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
        {info && <InfoTip term={info} />}
      </dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
