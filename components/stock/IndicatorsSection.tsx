import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { directionText } from '@/components/ui/change-badge'
import {
  getDailyOhlcv,
  AlphaVantageError,
  AlphaVantageRateLimitError,
} from '@/lib/apis/alpha-vantage'
import {
  summarizeIndicators,
  type IndicatorsSummary,
} from '@/lib/indicators'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { InfoTip } from '@/components/ui/info-tip'
import type { GlossaryKey } from '@/lib/glossary'
import { IoTime as Clock, IoAnalytics as ChartIcon } from 'react-icons/io5'

type Lean = 1 | 0 | -1

const LEAN_LABEL: Record<Lean, string> = {
  1: 'Bullish',
  0: 'Neutral',
  [-1]: 'Bearish',
}

/**
 * Each indicator reduced to one plain-language reading plus a lean, so the
 * section answers "what is the chart saying?" before showing raw numbers.
 */
function readSignals(s: IndicatorsSummary) {
  const price = s.current_price
  const dist = (sma: number | null) => (sma ? ((price - sma) / sma) * 100 : null)
  const smaLean = (sma: number | null): Lean =>
    sma == null ? 0 : price >= sma ? 1 : -1

  const rsiLean: Lean =
    s.signals.rsi === 'oversold' ? 1 : s.signals.rsi === 'overbought' ? -1 : 0
  const macdLean: Lean =
    s.signals.macd === 'bullish' ? 1 : s.signals.macd === 'bearish' ? -1 : 0
  const crossLean: Lean =
    s.signals.sma_cross_50_200 === 'golden'
      ? 1
      : s.signals.sma_cross_50_200 === 'death'
        ? -1
        : 0

  const leans: Lean[] = [
    smaLean(s.sma_20),
    smaLean(s.sma_50),
    smaLean(s.sma_200),
    macdLean,
    rsiLean,
    crossLean,
  ]
  const bullish = leans.filter((l) => l === 1).length
  const bearish = leans.filter((l) => l === -1).length
  const net = bullish - bearish
  const overall: { label: string; lean: Lean } =
    net >= 3
      ? { label: 'Bullish', lean: 1 }
      : net >= 1
        ? { label: 'Leaning bullish', lean: 1 }
        : net <= -3
          ? { label: 'Bearish', lean: -1 }
          : net <= -1
            ? { label: 'Leaning bearish', lean: -1 }
            : { label: 'Neutral', lean: 0 }

  return {
    bullish,
    bearish,
    neutral: leans.length - bullish - bearish,
    net,
    overall,
    rsiLean,
    macdLean,
    crossLean,
    smas: [
      { period: 20, value: s.sma_20, dist: dist(s.sma_20), lean: smaLean(s.sma_20) },
      { period: 50, value: s.sma_50, dist: dist(s.sma_50), lean: smaLean(s.sma_50) },
      { period: 200, value: s.sma_200, dist: dist(s.sma_200), lean: smaLean(s.sma_200) },
    ],
  }
}

export async function IndicatorsSection({ symbol }: { symbol: string }) {
  let summary: IndicatorsSummary
  try {
    const bars = await getDailyOhlcv(symbol)
    summary = summarizeIndicators(bars)
  } catch (err) {
    if (err instanceof AlphaVantageRateLimitError) {
      return (
        <Card>
          <EmptyState
            icon={Clock}
            tone="warning"
            title="Daily indicator quota reached"
            description="Alpha Vantage's free tier allows 25 requests per day. Technical signals will be back tomorrow."
            className="py-10"
          />
        </Card>
      )
    }
    const message =
      err instanceof AlphaVantageError ? err.message : 'Failed to compute indicators.'
    return <ErrorCard message={message} />
  }

  if (summary.bars_analyzed === 0) {
    return <ErrorCard message="No price data to analyze." />
  }

  const r = readSignals(summary)
  const atrPct =
    summary.atr_14 && summary.current_price
      ? (summary.atr_14 / summary.current_price) * 100
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical signals</CardTitle>
        <CardDescription>
          {r.bullish} bullish · {r.neutral} neutral · {r.bearish} bearish across
          six signals · {summary.bars_analyzed} daily bars
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <OverallMeter net={r.net} label={r.overall.label} lean={r.overall.lean} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SignalTile
            title="Trend vs moving averages"
            info="movingAverage"
            lean={
              r.smas.filter((m) => m.lean === 1).length >= 2
                ? 1
                : r.smas.filter((m) => m.lean === -1).length >= 2
                  ? -1
                  : 0
            }
          >
            <ul className="flex flex-col gap-1.5">
              {r.smas.map((m) => (
                <li key={m.period} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{m.period}-day</span>
                  {m.value != null && m.dist != null ? (
                    <span className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-xs text-muted-foreground">{usd(m.value)}</span>
                      <span className={cn('w-16 text-right font-medium', directionText(m.dist))}>
                        {m.dist >= 0 ? '+' : '−'}
                        {Math.abs(m.dist).toFixed(1)}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Needs more history</span>
                  )}
                </li>
              ))}
            </ul>
            {r.crossLean !== 0 && (
              <p className="text-xs text-muted-foreground">
                {r.crossLean === 1 ? 'Golden cross' : 'Death cross'}: 50-day{' '}
                {r.crossLean === 1 ? 'above' : 'below'} 200-day
              </p>
            )}
          </SignalTile>

          <SignalTile title="RSI (14) · momentum" info="rsi" lean={r.rsiLean}>
            {summary.rsi_14 != null ? (
              <>
                <p className="text-2xl font-semibold tracking-tight">
                  {summary.rsi_14.toFixed(0)}
                  <span className="ml-2 text-xs font-normal capitalize text-muted-foreground">
                    {summary.signals.rsi ?? 'neutral'}
                  </span>
                </p>
                <RsiGauge value={summary.rsi_14} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </SignalTile>

          <SignalTile title="MACD · trend momentum" info="macd" lean={r.macdLean}>
            {summary.macd ? (
              <>
                <p className="text-2xl font-semibold tracking-tight">
                  {summary.signals.macd === 'bullish' ? 'Rising' : 'Falling'}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  Line {summary.macd.line.toFixed(2)} · signal{' '}
                  {summary.macd.signal.toFixed(2)} · histogram{' '}
                  <span className={directionText(summary.macd.histogram)}>
                    {summary.macd.histogram >= 0 ? '+' : ''}
                    {summary.macd.histogram.toFixed(2)}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </SignalTile>

          <SignalTile title="Bollinger bands (20, 2σ)" info="bollinger" lean={0}>
            {summary.bollinger ? (
              <PositionBar
                low={summary.bollinger.lower}
                high={summary.bollinger.upper}
                mid={summary.bollinger.middle}
                value={summary.current_price}
                caption={
                  summary.signals.bollinger === 'near_upper'
                    ? 'Near the upper band — stretched'
                    : summary.signals.bollinger === 'near_lower'
                      ? 'Near the lower band — washed out'
                      : 'Inside the bands'
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </SignalTile>

          <SignalTile title="Range position" info="rangePosition" lean={0}>
            {summary.range_low != null && summary.range_high != null ? (
              <PositionBar
                low={summary.range_low}
                high={summary.range_high}
                value={summary.current_price}
                caption={`${summary.price_vs_range_pct?.toFixed(0) ?? '—'}% of the ${summary.bars_analyzed}-day range`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </SignalTile>

          <SignalTile title="ATR (14) · volatility" info="atr" lean={0}>
            {summary.atr_14 != null ? (
              <>
                <p className="text-2xl font-semibold tracking-tight">{usd(summary.atr_14)}</p>
                <p className="text-xs text-muted-foreground">
                  Typical daily move
                  {atrPct != null && ` · ${atrPct.toFixed(1)}% of price`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </SignalTile>
        </div>
      </CardContent>
    </Card>
  )
}

/** Five-step lean from bearish to bullish; the step lights where the net lands. */
function OverallMeter({ net, label, lean }: { net: number; label: string; lean: Lean }) {
  const step = net <= -3 ? 0 : net <= -1 ? 1 : net >= 3 ? 4 : net >= 1 ? 3 : 2
  const tones = ['bg-rose-400', 'bg-rose-400/60', 'bg-white/40', 'bg-emerald-400/60', 'bg-emerald-400']
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-40">
        <p className="text-xs text-muted-foreground">Overall technical read</p>
        <p className={cn('text-lg font-semibold', directionText(lean))}>{label}</p>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex gap-0.5" role="img" aria-label={`Overall technical read: ${label}`}>
          {tones.map((t, i) => (
            <span
              key={i}
              className={cn(
                'h-2 flex-1 first:rounded-l-full last:rounded-r-full',
                i === step ? t : 'bg-white/[0.07]'
              )}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>
    </div>
  )
}

function SignalTile({
  title,
  info,
  lean,
  children,
}: {
  title: string
  info: GlossaryKey
  lean: Lean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          <InfoTip term={info} />
        </p>
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', directionText(lean))}>
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {LEAN_LABEL[lean]}
        </span>
      </div>
      {children}
    </div>
  )
}

/** 0–100 track with the 30 / 70 thresholds shaded and a marker at the value. */
function RsiGauge({ value }: { value: number }) {
  const pos = Math.min(100, Math.max(0, value))
  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-1.5 rounded-full bg-white/[0.07]">
        <span className="absolute inset-y-0 left-0 w-[30%] rounded-l-full bg-emerald-400/25" />
        <span className="absolute inset-y-0 right-0 w-[30%] rounded-r-full bg-rose-400/25" />
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Oversold &lt;30</span>
        <span>&gt;70 Overbought</span>
      </div>
    </div>
  )
}

function PositionBar({
  low,
  high,
  mid,
  value,
  caption,
}: {
  low: number
  high: number
  mid?: number
  value: number
  caption: string
}) {
  const span = high - low || 1
  const pos = Math.min(100, Math.max(0, ((value - low) / span) * 100))
  const midPos = mid != null ? ((mid - low) / span) * 100 : null
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">{caption}</p>
      <div className="relative h-1.5 rounded-full bg-white/[0.07]">
        {midPos != null && (
          <span className="absolute inset-y-[-3px] w-px bg-white/25" style={{ left: `${midPos}%` }} />
        )}
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{usd(low)}</span>
        <span>{usd(high)}</span>
      </div>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <EmptyState
        icon={ChartIcon}
        tone="muted"
        title="Technical signals unavailable"
        description={message}
        className="py-10"
      />
    </Card>
  )
}
