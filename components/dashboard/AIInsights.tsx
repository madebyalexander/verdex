import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { StockLogo } from '@/components/ui/stock-logo'
import { EmptyState } from '@/components/ui/empty-state'
import { directionBg, directionText } from '@/components/ui/change-badge'
import {
  AICard,
  AIBadge,
  AIIcon,
  ConfidenceMeter,
  ForecastRangeBar,
  type Confidence,
} from '@/components/ui/ai-card'
import { getRecentInsights, type Insight } from '@/lib/insights'
import { getQuote, type FinnhubQuote } from '@/lib/apis/finnhub'
import type { Factor } from '@/lib/zod-schemas'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import {
  IoArrowDown as ArrowDown,
  IoArrowForward as ArrowRight,
  IoArrowUp as ArrowUp,
  IoSparkles as Sparks,
} from 'react-icons/io5'

type EnrichedInsight = Insight & {
  current: number | null
  forecast: number
  pctMove: number | null
  confidence: Confidence
  bias: 'bullish' | 'bearish' | 'neutral'
  /** "Actionability" = confidence × |pct_move|. Used to pick the hero. */
  score: number
}

const CONFIDENCE_WEIGHT = { high: 1, medium: 0.66, low: 0.33 } as const

function timeAgo(date: Date): string {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)} min ago`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)} hr ago`
  const days = hours / 24
  if (days < 7) return `${Math.round(days)}d ago`
  return date.toLocaleDateString()
}

function signedPct(v: number, digits = 1): string {
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}%`
}

function classifyBias(i: Insight): 'bullish' | 'bearish' | 'neutral' {
  const bull = (i.prediction.bullish_factors ?? []).reduce(
    (s, f) => s + (f.weight ?? 0),
    0
  )
  const bear = (i.prediction.bearish_factors ?? []).reduce(
    (s, f) => s + (f.weight ?? 0),
    0
  )
  if (bull > bear * 1.1) return 'bullish'
  if (bear > bull * 1.1) return 'bearish'
  return 'neutral'
}

async function enrich(insight: Insight): Promise<EnrichedInsight> {
  const horizon = insight.prediction.horizons?.['1m']
  const forecast = horizon?.base ?? 0
  const confidence = (horizon?.confidence ?? 'medium') as Confidence

  let current: number | null = null
  try {
    const q: FinnhubQuote = await getQuote(insight.symbol)
    current = typeof q.c === 'number' && q.c > 0 ? q.c : null
  } catch {
    current = null
  }

  const pctMove =
    current && forecast > 0 ? ((forecast - current) / current) * 100 : null

  return {
    ...insight,
    current,
    forecast,
    pctMove,
    confidence,
    bias: classifyBias(insight),
    score: (CONFIDENCE_WEIGHT[confidence] ?? 0.5) * Math.abs(pctMove ?? 0),
  }
}

export async function AIInsights() {
  const raw = await getRecentInsights(12)
  if (raw.length === 0) return <EmptyInsights />

  const enriched = await Promise.all(raw.map(enrich))
  const sorted = enriched.slice().sort((a, b) => b.score - a.score)
  const top = sorted[0]
  const rest = sorted.slice(1, 5)

  const mostRecent = Math.max(
    ...enriched.map((e) => new Date(e.generated_at).getTime())
  )

  const biasCounts = { bullish: 0, neutral: 0, bearish: 0 }
  for (const e of enriched) biasCounts[e.bias]++

  return (
    <AICard className="gap-0 py-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <AIIcon />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">AI Insights</h2>
            <p className="text-xs text-muted-foreground">
              {enriched.length} recent forecasts · updated{' '}
              {timeAgo(new Date(mostRecent))}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BiasSummary counts={biasCounts} />
          <AIBadge>AI estimate — not advice</AIBadge>
        </div>
      </div>

      <div className="grid gap-3 p-5 lg:grid-cols-5">
        <TopPickCard insight={top} className="lg:col-span-3" />

        {rest.length > 0 && (
          <div className="flex flex-col gap-2 lg:col-span-2">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              More AI calls
            </p>
            <ul className="flex flex-1 flex-col gap-2">
              {rest.map((i) => (
                <li key={i.symbol} className="flex-1">
                  <ForecastRow insight={i} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AICard>
  )
}

/** The single most actionable call: biggest move, discounted by confidence. */
function TopPickCard({
  insight,
  className,
}: {
  insight: EnrichedInsight
  className?: string
}) {
  const isUp = (insight.pctMove ?? 0) >= 0
  const byWeight = (a: Factor, b: Factor) => (b.weight ?? 0) - (a.weight ?? 0)
  const bullish = [...(insight.prediction.bullish_factors ?? [])].sort(byWeight)
  const bearish = [...(insight.prediction.bearish_factors ?? [])].sort(byWeight)
  // Lead with the drivers that agree with the call, then the strongest counterpoint.
  const drivers: { factor: Factor; tone: 'bullish' | 'bearish' }[] = isUp
    ? [
        ...bullish.slice(0, 3).map((factor) => ({ factor, tone: 'bullish' as const })),
        ...bearish.slice(0, 1).map((factor) => ({ factor, tone: 'bearish' as const })),
      ]
    : [
        ...bearish.slice(0, 3).map((factor) => ({ factor, tone: 'bearish' as const })),
        ...bullish.slice(0, 1).map((factor) => ({ factor, tone: 'bullish' as const })),
      ]

  const horizons = insight.prediction.horizons
  const h1m = horizons?.['1m']
  const pctFrom = (target: number | undefined) =>
    insight.current && target && target > 0
      ? ((target - insight.current) / insight.current) * 100
      : null

  return (
    <Link
      href={`/stocks/${insight.symbol}`}
      className={cn(
        'group flex flex-col gap-5 rounded-2xl bg-black/25 p-5 ring-1 ring-inset ring-primary/25 transition-colors',
        'hover:bg-black/15 hover:ring-primary/45',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StockLogo
            symbol={insight.symbol}
            className="size-11 rounded-xl text-sm ring-1 ring-inset ring-white/10"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight tabular-nums">
                {insight.symbol}
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Strongest signal
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {insight.current != null ? `Now ${usd(insight.current)} · ` : ''}
              1-month target {usd(insight.forecast)}
            </p>
          </div>
        </div>
        <ArrowRight
          aria-hidden
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Implied 1-month move</p>
          {insight.pctMove != null ? (
            <p
              className={cn(
                'text-4xl font-semibold tracking-tight tabular-nums',
                directionText(insight.pctMove)
              )}
            >
              {signedPct(insight.pctMove, 2)}
            </p>
          ) : (
            <p className="text-4xl font-semibold text-muted-foreground">—</p>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-5 text-right">
          {(['1w', '1m', '3m'] as const).map((h) => {
            const pct = pctFrom(horizons?.[h]?.base)
            return (
              <div key={h} className="flex flex-col gap-0.5">
                <dt className="text-[11px] font-medium uppercase text-muted-foreground">
                  {h}
                </dt>
                <dd
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    directionText(pct)
                  )}
                >
                  {pct != null ? signedPct(pct) : '—'}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      {h1m && (
        <ForecastRangeBar
          low={h1m.low}
          base={h1m.base}
          high={h1m.high}
          current={insight.current}
        />
      )}

      {drivers.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-medium text-muted-foreground">Key drivers</p>
          <ul className="flex flex-col gap-2">
            {drivers.map(({ factor, tone }) => (
              <FactorRow key={`${tone}-${factor.title}`} factor={factor} tone={tone} />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-xs text-muted-foreground">
        <ConfidenceMeter confidence={insight.confidence} />
        <span>Generated {timeAgo(new Date(insight.generated_at))}</span>
      </div>
    </Link>
  )
}

function FactorRow({
  factor,
  tone,
}: {
  factor: Factor
  tone: 'bullish' | 'bearish'
}) {
  const pct = Math.round((factor.weight ?? 0) * 100)
  const sign = tone === 'bullish' ? 1 : -1
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn('size-1.5 shrink-0 rounded-full', directionBg(sign))}
      />
      <span className="flex-1 truncate text-sm" title={factor.evidence}>
        {factor.title}
      </span>
      <span className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
        <span
          className={cn('block h-full rounded-full opacity-80', directionBg(sign))}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </li>
  )
}

function ForecastRow({ insight }: { insight: EnrichedInsight }) {
  return (
    <Link
      href={`/stocks/${insight.symbol}`}
      className="flex h-full items-center gap-3 rounded-xl bg-black/20 p-3 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.04] hover:ring-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <StockLogo symbol={insight.symbol} className="size-9 rounded-lg text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">{insight.symbol}</span>
          <ConfidenceMeter confidence={insight.confidence} showLabel={false} />
        </div>
        <p className="truncate text-xs text-muted-foreground tabular-nums">
          {insight.current != null
            ? `${usd(insight.current)} → ${usd(insight.forecast)}`
            : `Target ${usd(insight.forecast)}`}{' '}
          · 1m
        </p>
      </div>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          directionText(insight.pctMove)
        )}
      >
        {insight.pctMove != null ? signedPct(insight.pctMove, 2) : '—'}
      </span>
    </Link>
  )
}

function BiasSummary({
  counts,
}: {
  counts: { bullish: number; neutral: number; bearish: number }
}) {
  return (
    <div
      className="inline-flex h-5 items-center gap-2.5 rounded-full bg-white/[0.04] px-2.5 text-[11px] tabular-nums text-muted-foreground ring-1 ring-inset ring-white/[0.07]"
      aria-label={`${counts.bullish} bullish, ${counts.neutral} neutral, ${counts.bearish} bearish`}
    >
      <span className={cn('inline-flex items-center gap-0.5', directionText(1))}>
        <ArrowUp aria-hidden className="size-3" />
        {counts.bullish}
      </span>
      <span>{counts.neutral} neutral</span>
      <span className={cn('inline-flex items-center gap-0.5', directionText(-1))}>
        <ArrowDown aria-hidden className="size-3" />
        {counts.bearish}
      </span>
    </div>
  )
}

function EmptyInsights() {
  return (
    <AICard className="py-0">
      <EmptyState
        icon={Sparks}
        title="No AI forecasts yet"
        description="Open any stock and Verdex will generate a transparent 1-week, 1-month and 3-month forecast. The strongest calls show up here."
        action={
          <Link href="/market" className={buttonVariants()}>
            Browse markets
          </Link>
        }
      />
    </AICard>
  )
}
