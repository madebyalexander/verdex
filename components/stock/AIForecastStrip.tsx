import { Badge } from '@/components/ui/badge'
import { getCachedForecast } from '@/lib/forecast'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import {
  IoSparkles as Sparks,
  IoArrowDown as ArrowDown,
  IoArrowUp as ArrowUp,
} from 'react-icons/io5'

export async function AIForecastStrip({
  symbol,
  currentPrice,
  todayPctMove,
}: {
  symbol: string
  currentPrice: number
  todayPctMove: number | null | undefined
}) {
  // Read-only: never trigger fresh generation here. Strip appears only when
  // there's a cached forecast — full deep-dive lives in the AI Forecast tab.
  const forecast = await getCachedForecast(symbol)
  if (!forecast) return null

  const horizon = forecast.horizons?.['1m']
  if (!horizon) return null
  const base = horizon.base
  if (!(base > 0) || !(currentPrice > 0)) return null

  const pctMove = ((base - currentPrice) / currentPrice) * 100
  const isUp = pctMove >= 0
  const Arrow = isUp ? ArrowUp : ArrowDown
  const tone = isUp ? 'text-emerald-400' : 'text-rose-400'
  const confidence = horizon.confidence

  const todayDirUp = (todayPctMove ?? 0) > 0
  const aiDirUp = isUp
  const showCross =
    todayPctMove != null && Math.abs(todayPctMove) > 0 && todayDirUp !== aiDirUp
  const crossLabel = showCross
    ? aiDirUp
      ? 'AI sees upside'
      : 'AI sees downside'
    : null

  void symbol

  return (
    <section
      aria-label="AI forecast summary"
      className={cn(
        'flex items-center gap-3 flex-wrap rounded-xl px-3.5 py-2.5 ring-1 ring-inset',
        'bg-gradient-to-r from-primary/[0.10] via-card to-card ring-primary/25'
      )}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center size-5 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/30 text-primary shrink-0"
      >
        <Sparks className="size-3" />
      </span>
      <span className="text-[11px] uppercase tracking-wide font-medium text-primary/90">
        AI 1m forecast
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {usd(base)}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums',
          tone
        )}
      >
        <Arrow aria-hidden className="size-3" />
        {isUp ? '+' : ''}
        {pctMove.toFixed(2)}%
      </span>
      <ConfidencePill confidence={confidence} />
      {crossLabel && (
        <Badge
          variant="outline"
          className={cn(
            'border-transparent ring-1 ring-inset gap-1 text-[10px] uppercase tracking-wide',
            aiDirUp
              ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25'
              : 'bg-rose-500/10 text-rose-400 ring-rose-500/25'
          )}
        >
          {crossLabel}
        </Badge>
      )}
      <span className="text-[11px] text-muted-foreground ml-auto">
        See AI Forecast tab for full breakdown
      </span>
    </section>
  )
}

function ConfidencePill({
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
