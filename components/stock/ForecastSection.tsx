import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getCachedForecast,
  generateFreshForecast,
  type ForecastResult,
} from '@/lib/forecast'
import { GEMINI_MODEL } from '@/lib/apis/gemini'
import { UnknownSymbolError } from '@/lib/apis/finnhub'
import type { Factor, Horizon, ForecastOutput } from '@/lib/zod-schemas'
import { RefreshForecastButton } from './RefreshForecastButton'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'

const confidencePct: Record<Horizon['confidence'], number> = {
  low: 33,
  medium: 66,
  high: 100,
}

export async function ForecastSection({ symbol }: { symbol: string }) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>AI Forecast</CardTitle>
              <Badge
                variant="outline"
                className="border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
              >
                AI estimate — not advice
              </Badge>
            </div>
            <CardDescription>
              {sourceLabel}
              {generated_at &&
                ` · ${new Date(generated_at).toLocaleString()}`}{' '}
              · {model}
            </CardDescription>
          </div>
          <RefreshForecastButton symbol={symbol} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <HorizonCard label="1 week" horizon={forecast.horizons['1w']} />
          <HorizonCard label="1 month" horizon={forecast.horizons['1m']} />
          <HorizonCard label="3 months" horizon={forecast.horizons['3m']} />
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-line">
          {forecast.narrative}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FactorList
            title="Bullish drivers"
            tone="success"
            factors={forecast.bullish_factors}
          />
          <FactorList
            title="Bearish drivers"
            tone="danger"
            factors={forecast.bearish_factors}
          />
        </div>

        <Risks risks={forecast.risks} />

        {forecast.data_quality_notes && (
          <p className="text-xs italic text-muted-foreground">
            {forecast.data_quality_notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function HorizonCard({ label, horizon }: { label: string; horizon: Horizon }) {
  const confidenceValue = confidencePct[horizon.confidence]
  return (
    <div className="p-3 rounded-md flex flex-col gap-1.5 bg-secondary ring-1 ring-inset ring-border/50">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-semibold tabular-nums">{usd(horizon.base)}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {usd(horizon.low)} – {usd(horizon.high)}
      </p>
      <div
        role="progressbar"
        aria-label={`${horizon.confidence} confidence`}
        aria-valuenow={confidenceValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 rounded-full overflow-hidden mt-1 bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${confidenceValue}%` }}
        />
      </div>
      <p className="text-xs capitalize text-muted-foreground">
        {horizon.confidence} confidence
      </p>
    </div>
  )
}

function FactorList({
  title,
  tone,
  factors,
}: {
  title: string
  tone: 'success' | 'danger'
  factors: Factor[]
}) {
  return (
    <div>
      <p
        className={cn(
          'text-xs uppercase tracking-wide font-semibold mb-2',
          tone === 'success' ? 'text-emerald-400' : 'text-rose-400'
        )}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {factors.map((f, i) => (
          <FactorRow key={i} factor={f} tone={tone} />
        ))}
      </ul>
    </div>
  )
}

function FactorRow({
  factor,
  tone,
}: {
  factor: Factor
  tone: 'success' | 'danger'
}) {
  const widthPct = Math.round(factor.weight * 100)
  return (
    <li className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{factor.title}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {widthPct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${factor.title} factor weight`}
        aria-valuenow={widthPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 rounded-full overflow-hidden mt-1.5 bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
          )}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <p className="text-xs mt-1.5 text-muted-foreground">{factor.evidence}</p>
    </li>
  )
}

function Risks({ risks }: { risks: ForecastOutput['risks'] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-muted-foreground">
        Risks
      </p>
      <ul className="list-disc pl-5 text-sm flex flex-col gap-1.5">
        {risks.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function ForecastError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>AI Forecast</CardTitle>
          <Badge
            variant="outline"
            className="border-transparent bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20"
          >
            Unavailable
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm py-6 text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}
