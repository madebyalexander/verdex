import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { StockLogo } from '@/components/ui/stock-logo'
import { getRecentInsights, type Insight } from '@/lib/insights'
import { getQuote, type FinnhubQuote } from '@/lib/apis/finnhub'
import type { Factor } from '@/lib/zod-schemas'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { IoArrowDown as ArrowDown, IoArrowForward as ArrowRight, IoArrowUp as ArrowUp, IoSparkles as Sparks } from 'react-icons/io5'

type EnrichedInsight = Insight & {
  current: number | null
  forecast: number
  pctMove: number | null
  confidence: 'high' | 'medium' | 'low'
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
  if (days < 7) {
    const d = Math.round(days)
    return `${d}d ago`
  }
  return date.toLocaleDateString()
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
  const confidence = (horizon?.confidence ?? 'medium') as
    | 'high'
    | 'medium'
    | 'low'

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
    score:
      (CONFIDENCE_WEIGHT[confidence] ?? 0.5) * Math.abs(pctMove ?? 0),
  }
}

export async function AIInsights() {
  const raw = await getRecentInsights(12)
  if (raw.length === 0) return <EmptyState />

  const enriched = await Promise.all(raw.map(enrich))
  const sorted = enriched.slice().sort((a, b) => b.score - a.score)
  const top = sorted[0]
  const rest = sorted.slice(1, 4)

  const mostRecent = Math.max(
    ...enriched.map((e) => new Date(e.generated_at).getTime())
  )
  const lastLabel = timeAgo(new Date(mostRecent))

  const biasCounts = { bullish: 0, neutral: 0, bearish: 0 }
  for (const e of enriched) biasCounts[e.bias]++

  return (
    <RevolutAICard>
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <HeaderRow
          lastLabel={lastLabel}
          total={enriched.length}
          biasCounts={biasCounts}
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
          <div className="min-w-0 flex-1 lg:flex-[3]">
            <TopPickCard insight={top} total={enriched.length} />
          </div>

          {rest.length > 0 && (
            <ul className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-[2] lg:max-w-md">
              {rest.map((i) => (
                <li key={i.symbol} className="min-h-0 flex-1">
                  <ForecastTile insight={i} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RevolutAICard>
  )
}

function HeaderRow({
  lastLabel,
  total,
  biasCounts,
}: {
  lastLabel: string
  total: number
  biasCounts: { bullish: number; neutral: number; bearish: number }
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/25 text-emerald-400"
        >
          <Sparks className="size-3" />
        </span>
        <span className="text-sm font-medium">AI Insights</span>
        <Badge
          variant="outline"
          className="border-transparent bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 h-5 text-[10px]"
        >
          Gemini 2.5 Flash
        </Badge>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-end text-xs text-muted-foreground tabular-nums">
        <BiasSummary counts={biasCounts} />
        <span aria-hidden className="text-border">
          ·
        </span>
        <span>
          {total} cached · {lastLabel}
        </span>
      </div>
    </div>
  )
}

/** Visually prominent card showing the AI's most actionable call,
 *  with a rationale panel that explains *why* it's the top pick. */
function TopPickCard({
  insight,
  total,
}: {
  insight: EnrichedInsight
  total: number
}) {
  const isUp = (insight.pctMove ?? 0) >= 0
  const Arrow = isUp ? ArrowUp : ArrowDown
  const moveColor = isUp ? 'text-emerald-400' : 'text-rose-400'

  const bullish = [...(insight.prediction.bullish_factors ?? [])].sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0)
  )
  const bearish = [...(insight.prediction.bearish_factors ?? [])].sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0)
  )

  const h1w = insight.prediction.horizons?.['1w']
  const h1m = insight.prediction.horizons?.['1m']
  const h3m = insight.prediction.horizons?.['3m']

  const pctFrom = (target: number | undefined) =>
    insight.current && target && target > 0
      ? ((target - insight.current) / insight.current) * 100
      : null

  return (
    <Link
      href={`/stocks/${insight.symbol}`}
      className={cn(
        'group flex h-full flex-col gap-3 rounded-xl p-3 transition-colors',
        'bg-card/40 ring-1 ring-inset ring-emerald-500/30',
        'hover:bg-secondary/40 hover:ring-emerald-500/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40'
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StockLogo
            symbol={insight.symbol}
            className="size-8 rounded-lg text-sm ring-1 ring-inset ring-emerald-500/25"
          />

          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold tabular-nums">
              {insight.symbol}
            </span>
            <span className="text-[11px] text-emerald-400/80 uppercase tracking-wide font-medium">
              Top pick
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold tabular-nums">
              {insight.current != null
                ? `${usd(insight.current)} → ${usd(insight.forecast)}`
                : usd(insight.forecast)}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              1-month forecast
            </span>
          </div>

          {insight.pctMove != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums',
                moveColor
              )}
            >
              <Arrow aria-hidden className="size-3" />
              {isUp ? '+' : ''}
              {insight.pctMove.toFixed(2)}%
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}

          <div className="flex items-center gap-1.5">
            <ConfidenceBadge confidence={insight.confidence} />
            <ArrowRight
              aria-hidden
              className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start gap-3 w-full">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wide font-medium">
            Why it&apos;s the top pick
          </span>
          <span className="text-[11px] text-muted-foreground">
            highest conviction-weighted move among {total} forecasts
          </span>
        </div>

        {(bullish.length > 0 || bearish.length > 0) && (
          <ul className="flex w-full flex-col gap-1.5">
            {bullish.slice(0, 3).map((f) => (
              <FactorRow key={`b-${f.title}`} factor={f} tone="bullish" />
            ))}
            {bearish[0] && (
              <FactorRow key={`r-${bearish[0].title}`} factor={bearish[0]} tone="bearish" />
            )}
          </ul>
        )}

        <div className="mt-auto flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums pt-2 border-t border-border/40">
          {h1m && (
            <span>
              Range{' '}
              <span className="text-[#fafafa]">
                {usd(h1m.low)}–{usd(h1m.high)}
              </span>
            </span>
          )}
          <HorizonChip label="1w" pct={pctFrom(h1w?.base)} />
          <HorizonChip label="1m" pct={pctFrom(h1m?.base)} />
          <HorizonChip label="3m" pct={pctFrom(h3m?.base)} />
        </div>
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
  const isBull = tone === 'bullish'
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full shrink-0',
          isBull ? 'bg-emerald-400' : 'bg-rose-400'
        )}
      />
      <span
        className="text-xs text-[#fafafa] flex-1 truncate"
        title={factor.evidence}
      >
        {factor.title}
      </span>
      <div className="w-14 h-1 rounded-full bg-foreground/10 overflow-hidden shrink-0">
        <div
          className={cn('h-full', isBull ? 'bg-emerald-400/80' : 'bg-rose-400/80')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
        {pct}%
      </span>
    </li>
  )
}

function HorizonChip({ label, pct }: { label: string; pct: number | null }) {
  if (pct == null) return null
  const isUp = pct >= 0
  return (
    <span>
      {label}{' '}
      <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
        {isUp ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    </span>
  )
}

function ForecastTile({ insight }: { insight: EnrichedInsight }) {
  const hasMove = insight.pctMove != null
  const isUp = (insight.pctMove ?? 0) >= 0
  const generated = timeAgo(new Date(insight.generated_at))

  return (
    <Link
      href={`/stocks/${insight.symbol}`}
      className="flex flex-col gap-2 h-full rounded-xl bg-card/40 ring-1 ring-inset ring-border/40 p-3 transition-colors hover:bg-secondary/40 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StockLogo
            symbol={insight.symbol}
            className="size-6 rounded-md text-[11px]"
          />
          <span className="text-sm font-semibold tabular-nums truncate">
            {insight.symbol}
          </span>
        </div>
        <ConfidenceBadge confidence={insight.confidence} />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums tracking-tight">
          {usd(insight.forecast)}
        </span>
        {hasMove ? (
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              isUp ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {isUp ? '+' : ''}
            {insight.pctMove!.toFixed(2)}%
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground tabular-nums truncate">
        {insight.current != null
          ? `from ${usd(insight.current)} · 1m forecast · ${generated}`
          : `1m forecast · ${generated}`}
      </p>
    </Link>
  )
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: 'high' | 'medium' | 'low'
}) {
  const tone =
    confidence === 'high'
      ? 'bg-emerald-500/12 text-emerald-400 ring-emerald-500/25'
      : confidence === 'medium'
        ? 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/25'
        : 'bg-amber-500/12 text-amber-400 ring-amber-500/25'
  return (
    <span
      className={cn(
        'inline-flex items-center h-4 px-1.5 rounded-full text-[10px] font-medium ring-1 ring-inset uppercase tracking-wide',
        tone
      )}
    >
      {confidence}
    </span>
  )
}

function BiasSummary({
  counts,
}: {
  counts: { bullish: number; neutral: number; bearish: number }
}) {
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="inline-flex items-center gap-1">
        <ArrowUp aria-hidden className="size-3 text-emerald-400" />
        {counts.bullish}
      </span>
      <span className="text-zinc-400">{counts.neutral} neutral</span>
      <span className="inline-flex items-center gap-1">
        <ArrowDown aria-hidden className="size-3 text-rose-400" />
        {counts.bearish}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <RevolutAICard>
      <div className="flex flex-col gap-2 p-5">
        <div className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/25 text-emerald-400"
          >
            <Sparks className="size-3" />
          </span>
          <span className="text-sm font-medium">AI Insights</span>
        </div>
        <p className="text-base font-semibold tracking-tight">
          No forecasts cached yet
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          Open any stock and head to the AI Forecast tab. Generated forecasts
          land here as a ranked dashboard view.
        </p>
      </div>
    </RevolutAICard>
  )
}

function RevolutAICard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl ring-1 ring-foreground/10 bg-card',
        'bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.18)_0%,rgba(16,185,129,0.06)_35%,transparent_65%)]'
      )}
    >
      {children}
    </div>
  )
}
