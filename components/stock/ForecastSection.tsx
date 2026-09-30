import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AICard,
  AIBadge,
  AIIcon,
  ConfidenceMeter,
  ForecastRangeBar,
} from '@/components/ui/ai-card'
import { ChangeText, directionBg, directionText } from '@/components/ui/change-badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getCachedForecast,
  generateFreshForecast,
  type ForecastResult,
} from '@/lib/forecast'
import { GEMINI_MODEL } from '@/lib/apis/gemini'
import { UnknownSymbolError } from '@/lib/apis/finnhub'
import type { Factor, Horizon, ForecastOutput } from '@/lib/zod-schemas'
import type { ForecastHorizonKey, RiskProfile } from '@/lib/preferences'
import { RefreshForecastButton } from './RefreshForecastButton'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import {
  IoTrendingUp as TrendingUp,
  IoTrendingDown as TrendingDown,
  IoWarning as Warning,
} from 'react-icons/io5'

export async function ForecastSection({
  symbol,
  currentPrice,
  preferredHorizon,
  riskProfile,
}: {
  symbol: string
  currentPrice: number
  preferredHorizon?: ForecastHorizonKey
  riskProfile?: RiskProfile
}) {
  let result: ForecastResult
  try {
    const cached = await getCachedForecast(symbol)
    if (cached) {
      result = {
        forecast: cached,
        source: 'cache',
        generated_at: null,
        model: GEMINI_MODEL,
      }
    } else {
      result = await generateFreshForecast(symbol)
    }
  } catch (err) {
    if (err instanceof UnknownSymbolError) {
      return <ForecastError message="Symbol not found." />
    }
    console.error('[ForecastSection]', err)
    return (
      <ForecastError message="Gemini couldn't generate this forecast. Check that GEMINI_API_KEY is set in .env.local, or that the daily quota hasn't been exhausted." />
    )
  }

  const { forecast, source, generated_at, model } = result
  const sourceLabel =
    source === 'cache'
      ? 'Cached forecast'
      : source === 'fallback'
        ? 'Cached forecast (live generation failed)'
        : 'Just generated'

  const paragraphs = forecast.narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <AICard className="gap-6">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AIIcon />
            <div className="min-w-0">
              <CardTitle className="text-base">AI Forecast</CardTitle>
              <p className="text-xs text-muted-foreground">
                {sourceLabel}
                {generated_at && ` · ${new Date(generated_at).toLocaleString()}`}{' '}
                · {model}
              </p>
            </div>
          </div>
          <RefreshForecastButton symbol={symbol} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AIBadge>AI estimate — not advice</AIBadge>
          {riskProfile && riskProfile !== 'balanced' && (
            <Badge
              variant="outline"
              className="border-transparent bg-white/[0.05] text-muted-foreground ring-1 ring-inset ring-white/[0.08] capitalize"
            >
              {riskProfile} framing
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(
            [
              ['1w', '1 week'],
              ['1m', '1 month'],
              ['3m', '3 months'],
            ] as const
          ).map(([key, label]) => (
            <HorizonCard
              key={key}
              label={label}
              horizon={forecast.horizons[key]}
              currentPrice={currentPrice}
              highlighted={preferredHorizon === key}
              risk={riskProfile}
            />
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">What the model sees</h3>
          <div className="flex flex-col gap-3 border-l-2 border-primary/50 pl-4 text-[15px] leading-relaxed text-foreground/90">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FactorList tone="bullish" factors={forecast.bullish_factors} />
          <FactorList tone="bearish" factors={forecast.bearish_factors} />
        </div>

        <Risks risks={forecast.risks} />

        {forecast.data_quality_notes && (
          <p className="text-xs text-muted-foreground simple:hidden">
            <span className="font-medium text-foreground/70">Data notes · </span>
            {forecast.data_quality_notes}
          </p>
        )}
      </CardContent>
    </AICard>
  )
}

function HorizonCard({
  label,
  horizon,
  currentPrice,
  highlighted,
  risk,
}: {
  label: string
  horizon: Horizon
  currentPrice: number
  highlighted?: boolean
  risk?: RiskProfile
}) {
  const hasCurrent = currentPrice > 0
  const move = hasCurrent ? horizon.base - currentPrice : null
  const movePct = move != null ? (move / currentPrice) * 100 : null

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl bg-black/25 p-4 ring-1 ring-inset',
        highlighted ? 'ring-primary/50' : 'ring-white/[0.07]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {highlighted && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Your default
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Base case</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {usd(horizon.base)}
        </p>
        {movePct != null && (
          <ChangeText pct={movePct} abs={move} label="vs today" className="text-xs" />
        )}
      </div>
      <ForecastRangeBar
        low={horizon.low}
        base={horizon.base}
        high={horizon.high}
        current={hasCurrent ? currentPrice : null}
        emphasize={
          risk === 'conservative' ? 'low' : risk === 'aggressive' ? 'high' : undefined
        }
      />
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-xs text-muted-foreground">Confidence</span>
        <ConfidenceMeter confidence={horizon.confidence} />
      </div>
    </div>
  )
}

function FactorList({
  tone,
  factors,
}: {
  tone: 'bullish' | 'bearish'
  factors: Factor[]
}) {
  const sign = tone === 'bullish' ? 1 : -1
  const Icon = tone === 'bullish' ? TrendingUp : TrendingDown
  const sorted = [...factors].sort((a, b) => b.weight - a.weight)
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-black/20 p-4 ring-1 ring-inset ring-white/[0.06]">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden className={cn('size-4', directionText(sign))} />
        {tone === 'bullish' ? 'Bullish drivers' : 'Bearish drivers'}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">
          {factors.length}
        </span>
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">None identified.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((f, i) => (
            <FactorRow key={i} factor={f} sign={sign} />
          ))}
        </ul>
      )}
    </section>
  )
}

function FactorRow({ factor, sign }: { factor: Factor; sign: number }) {
  const widthPct = Math.round(factor.weight * 100)
  return (
    <li className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{factor.title}</span>
        <span className="text-xs tabular-nums text-muted-foreground simple:hidden">
          {widthPct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${factor.title} factor weight`}
        aria-valuenow={widthPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 overflow-hidden rounded-full bg-white/[0.06] simple:hidden"
      >
        <div
          className={cn('h-full rounded-full opacity-80', directionBg(sign))}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{factor.evidence}</p>
    </li>
  )
}

function Risks({ risks }: { risks: ForecastOutput['risks'] }) {
  if (risks.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Key risks</h3>
      <ul className="grid gap-2 md:grid-cols-2">
        {risks.map((r, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-xl bg-amber-500/[0.06] p-3 text-sm leading-snug ring-1 ring-inset ring-amber-500/15"
          >
            <Warning aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ForecastError({ message }: { message: string }) {
  return (
    <AICard className="py-0">
      <EmptyState
        icon={Warning}
        tone="warning"
        title="AI forecast unavailable"
        description={message}
      />
    </AICard>
  )
}
