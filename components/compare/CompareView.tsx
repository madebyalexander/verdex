import Link from 'next/link'
import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getQuote,
  getProfile,
  getStockMetrics,
  type FinnhubQuote,
  type FinnhubProfile,
  type FinnhubMetrics,
} from '@/lib/apis/finnhub'
import { getDailyOhlcv, type OhlcvBar } from '@/lib/apis/alpha-vantage'
import { summarizeIndicators } from '@/lib/indicators'
import { CompareChart, type CompareSeries } from './CompareChart'
import { cn } from '@/lib/utils'
import { usd, compactUsd } from '@/lib/format'

// Aligned with --chart-1..4 in globals.css.
const COLORS = ['#9353D3', '#0EA5E9', '#F59E0B', '#EC4899'] as const


function normalize(bars: OhlcvBar[]): CompareSeries['data'] {
  if (bars.length === 0) return []
  const base = bars[0].close
  if (base === 0) return []
  return bars.map((b) => ({
    time: b.time,
    value: ((b.close - base) / base) * 100,
  }))
}

type CompareEntry = {
  symbol: string
  color: string
  quote: FinnhubQuote | null
  profile: FinnhubProfile | null
  metrics: FinnhubMetrics | null
  bars: OhlcvBar[]
  error: boolean
}

export async function CompareView({ symbols }: { symbols: string[] }) {
  const entries: CompareEntry[] = await Promise.all(
    symbols.map(async (symbol, i) => {
      const color = COLORS[i % COLORS.length]
      try {
        const [quote, profile, metrics, bars] = await Promise.all([
          getQuote(symbol).catch(() => null),
          getProfile(symbol).catch(() => null),
          getStockMetrics(symbol).catch(() => null),
          getDailyOhlcv(symbol).catch(() => [] as OhlcvBar[]),
        ])
        return {
          symbol,
          color,
          quote,
          profile,
          metrics,
          bars,
          error: !quote && !profile,
        }
      } catch {
        return {
          symbol,
          color,
          quote: null,
          profile: null,
          metrics: null,
          bars: [],
          error: true,
        }
      }
    })
  )

  const chartSeries: CompareSeries[] = entries
    .filter((e) => e.bars.length > 0)
    .map((e) => ({
      symbol: e.symbol,
      color: e.color,
      data: normalize(e.bars),
    }))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Overlay chart</CardTitle>
          <CardDescription>
            Prices normalized to 0% on first day · Alpha Vantage daily
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartSeries.length > 0 ? (
            <CompareChart series={chartSeries} />
          ) : (
            <p className="text-sm py-6 text-center text-muted-foreground">
              No historical data available for the selected symbols. Alpha
              Vantage free-tier limits (25/day, 5/min) may be in effect.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Side-by-side</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto -mx-1 px-1 [mask-image:linear-gradient(to_right,transparent_0,black_0.5rem,black_calc(100%-0.5rem),transparent_100%)] sm:[mask-image:none]">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-border">
                  <Th align="left">Metric</Th>
                  {entries.map((e) => (
                    <Th key={e.symbol} align="right">
                      <Link
                        href={`/stocks/${e.symbol}`}
                        className="underline underline-offset-2 hover:opacity-80"
                        style={{ color: e.color }}
                      >
                        {e.symbol}
                      </Link>
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row
                  label="Company"
                  entries={entries}
                  render={(e) => e.profile?.name ?? '—'}
                />
                <Row
                  label="Sector"
                  entries={entries}
                  render={(e) => e.profile?.finnhubIndustry ?? '—'}
                />
                <Row
                  label="Price"
                  entries={entries}
                  render={(e) => (e.quote ? usd(e.quote.c) : '—')}
                  numeric
                />
                <Row
                  label="Change today"
                  entries={entries}
                  render={(e) => {
                    if (!e.quote || e.quote.dp == null) return '—'
                    const up = e.quote.dp >= 0
                    const Icon = up ? ArrowUp : ArrowDown
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center justify-end gap-0.5',
                          up ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        <Icon aria-hidden className="size-3" />
                        {Math.abs(e.quote.dp).toFixed(2)}%
                      </span>
                    )
                  }}
                  numeric
                />
                <Row
                  label="Market cap"
                  entries={entries}
                  render={(e) =>
                    e.profile?.marketCapitalization
                      ? compactUsd(e.profile.marketCapitalization * 1_000_000)
                      : '—'
                  }
                  numeric
                />
                <Row
                  label="P/E (TTM)"
                  entries={entries}
                  render={(e) => formatMetric(e.metrics?.peTTM, 1)}
                  numeric
                />
                <Row
                  label="EPS (TTM)"
                  entries={entries}
                  render={(e) => formatMetric(e.metrics?.epsTTM, 2)}
                  numeric
                />
                <Row
                  label="Dividend yield"
                  entries={entries}
                  render={(e) => {
                    const v = e.metrics?.dividendYieldIndicatedAnnual
                    if (v == null || typeof v !== 'number') return '—'
                    return `${v.toFixed(2)}%`
                  }}
                  numeric
                />
                <Row
                  label="Beta"
                  entries={entries}
                  render={(e) => formatMetric(e.metrics?.beta, 2)}
                  numeric
                />
                <Row
                  label="52w high"
                  entries={entries}
                  render={(e) => {
                    const v = e.metrics?.['52WeekHigh']
                    return typeof v === 'number' ? usd(v) : '—'
                  }}
                  numeric
                />
                <Row
                  label="52w low"
                  entries={entries}
                  render={(e) => {
                    const v = e.metrics?.['52WeekLow']
                    return typeof v === 'number' ? usd(v) : '—'
                  }}
                  numeric
                />
                <Row
                  label="RSI(14)"
                  entries={entries}
                  render={(e) => {
                    if (e.bars.length === 0) return '—'
                    const s = summarizeIndicators(e.bars)
                    return s.rsi_14 != null ? s.rsi_14.toFixed(1) : '—'
                  }}
                  numeric
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatMetric(
  value: number | string | null | undefined,
  digits = 2
): string {
  if (typeof value !== 'number') return '—'
  return value.toFixed(digits)
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={cn(
        'py-2 px-3 font-medium text-xs uppercase tracking-wide text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  )
}

function Row({
  label,
  entries,
  render,
  numeric = false,
}: {
  label: string
  entries: CompareEntry[]
  render: (e: CompareEntry) => React.ReactNode
  numeric?: boolean
}) {
  return (
    <tr className="border-b border-border">
      <td className="py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </td>
      {entries.map((e) => (
        <td
          key={e.symbol}
          className={cn(
            'py-2 px-3',
            numeric ? 'text-right tabular-nums' : 'text-left'
          )}
        >
          {render(e)}
        </td>
      ))}
    </tr>
  )
}
