import { AIBadge, AIIcon, ConfidenceMeter } from '@/components/ui/ai-card'
import { ChangeText } from '@/components/ui/change-badge'
import { getCachedForecast } from '@/lib/forecast'
import { usd } from '@/lib/format'
import { IoArrowDown as ArrowDown } from 'react-icons/io5'

/**
 * One-line AI outlook shown under the stock hero. Read-only: it never
 * triggers generation, so it only appears once a forecast is cached — the
 * full breakdown lives in the AI Forecast tab below.
 */
export async function AIForecastStrip({
  symbol,
  currentPrice,
}: {
  symbol: string
  currentPrice: number
}) {
  const forecast = await getCachedForecast(symbol)
  const horizon = forecast?.horizons?.['1m']
  if (!horizon || !(horizon.base > 0) || !(currentPrice > 0)) return null

  const move = horizon.base - currentPrice
  const pctMove = (move / currentPrice) * 100

  return (
    <a
      href="#ai-forecast"
      aria-label={`AI 1-month outlook for ${symbol}: ${usd(horizon.base)}. Jump to the full forecast.`}
      className="group ai-surface relative flex flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden rounded-2xl px-4 py-3 ring-1 ring-primary/25 transition-shadow hover:ring-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3">
        <AIIcon className="size-9" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">AI 1-month outlook</span>
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold tabular-nums">
              {usd(horizon.base)}
            </span>
            <ChangeText pct={pctMove} abs={move} className="text-sm" />
          </span>
        </div>
      </div>
      <ConfidenceMeter confidence={horizon.confidence} verbose />
      <AIBadge className="hidden sm:inline-flex">AI estimate — not advice</AIBadge>
      <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
        Full forecast
        <ArrowDown
          aria-hidden
          className="size-3.5 transition-transform group-hover:translate-y-0.5"
        />
      </span>
    </a>
  )
}
