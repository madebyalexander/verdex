import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AICard,
  AIBadge,
  AIIcon,
  ConfidenceMeter,
} from '@/components/ui/ai-card'
import { ChangeText, directionBg, directionText } from '@/components/ui/change-badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { ForecastPathChart } from './ForecastPathChart'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import {
  IoTrendingUp as TrendingUp,
  IoTrendingDown as TrendingDown,
  IoWarning as Warning,
  IoChevronDown as ChevronDown,
} from 'react-icons/io5'

const HORIZONS: { key: ForecastHorizonKey; label: string }[] = [
  { key: '1w', label: '1 week' },
  { key: '1m', label: '1 month' },
  { key: '3m', label: '3 months' },
]

// Collapsible panel: animates height via Base UI's measured CSS variable.
const PANEL =
  'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0'

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
  const [lead, ...rest] = paragraphs

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
              className="border-transparent bg-white/[0.05] capitalize text-muted-foreground ring-1 ring-inset ring-white/[0.08]"
            >
              {riskProfile} framing
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-7">
        {/* Path + horizon table: one picture, three rows of numbers. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="rounded-2xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.07] lg:col-span-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Forecast path · base case with low–high range
            </p>
            <ForecastPathChart current={currentPrice} horizons={forecast.horizons} />
          </div>
          <ul className="flex flex-col divide-y divide-white/[0.06] rounded-2xl bg-black/25 ring-1 ring-inset ring-white/[0.07] lg:col-span-2">
            {HORIZONS.map(({ key, label }) => (
              <HorizonRow
                key={key}
                label={label}
                horizon={forecast.horizons[key]}
                currentPrice={currentPrice}
                highlighted={preferredHorizon === key}
                risk={riskProfile}
              />
            ))}
          </ul>
        </div>

        {lead && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold">In short</h3>
            <p className="border-l-2 border-primary/60 pl-4 text-[15px] leading-relaxed text-foreground/90">
              {lead}
            </p>
            {rest.length > 0 && (
              <Collapsible>
                <CollapsibleContent className={PANEL}>
                  <div className="flex flex-col gap-3 border-l-2 border-primary/25 pl-4 pt-1 text-sm leading-relaxed text-muted-foreground">
                    {rest.map((p, i) => (
                      <p key={i} className="whitespace-pre-line">
                        {p}
                      </p>
                    ))}
                  </div>
                </CollapsibleContent>
                <CollapsibleTrigger className="group mt-1 inline-flex items-center gap-1 rounded-md pl-4 text-xs font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                  <span className="group-data-panel-open:hidden">Read the full analysis</span>
                  <span className="hidden group-data-panel-open:inline">Show less</span>
                  <ChevronDown
                    aria-hidden
                    className="size-3.5 transition-transform group-data-panel-open:rotate-180"
                  />
                </CollapsibleTrigger>
              </Collapsible>
            )}
          </section>
        )}

        <section className="flex flex-col gap-4">
          <SignalBalance
            bullish={forecast.bullish_factors}
            bearish={forecast.bearish_factors}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FactorList tone="bullish" factors={forecast.bullish_factors} />
            <FactorList tone="bearish" factors={forecast.bearish_factors} />
          </div>
        </section>

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

function HorizonRow({
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
  const movePct =
    currentPrice > 0 ? ((horizon.base - currentPrice) / currentPrice) * 100 : null

  return (
    <li
      className={cn(
        'relative flex flex-1 flex-col justify-center gap-1.5 px-4 py-3.5',
        highlighted &&
          'before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-primary'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          {label}
          {highlighted && (
            <span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-primary">
              Default
            </span>
          )}
        </span>
        <ConfidenceMeter confidence={horizon.confidence} />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xl font-semibold tracking-tight">{usd(horizon.base)}</span>
        {movePct != null && (
          <ChangeText pct={movePct} showIcon={false} className="text-sm" />
        )}
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        Range{' '}
        <span className={cn(risk === 'conservative' && 'font-semibold text-foreground')}>
          {usd(horizon.low)}
        </span>
        {' – '}
        <span className={cn(risk === 'aggressive' && 'font-semibold text-foreground')}>
          {usd(horizon.high)}
        </span>
      </p>
    </li>
  )
}

/** Share of the model's weighted evidence on each side, as one split bar. */
function SignalBalance({
  bullish,
  bearish,
}: {
  bullish: Factor[]
  bearish: Factor[]
}) {
  const bull = bullish.reduce((s, f) => s + f.weight, 0)
  const bear = bearish.reduce((s, f) => s + f.weight, 0)
  const total = bull + bear || 1
  const bullPct = Math.round((bull / total) * 100)
  const verdict =
    bullPct >= 60 ? 'Leans bullish' : bullPct <= 40 ? 'Leans bearish' : 'Balanced'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">What drives the forecast</h3>
        <span className="text-xs text-muted-foreground">
          Weighted evidence ·{' '}
          <span className="font-medium text-foreground">{verdict}</span>
        </span>
      </div>
      <div
        role="img"
        aria-label={`${bullPct}% of weighted evidence bullish, ${100 - bullPct}% bearish`}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
      >
        <div className="rounded-l-full bg-emerald-400/85" style={{ width: `${bullPct}%` }} />
        <div className="rounded-r-full bg-rose-400/85" style={{ width: `${100 - bullPct}%` }} />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>
          <span className={directionText(1)}>●</span> Bullish {bullPct}%
        </span>
        <span>
          Bearish {100 - bullPct}% <span className={directionText(-1)}>●</span>
        </span>
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
    <div className="flex flex-col rounded-2xl bg-black/20 ring-1 ring-inset ring-white/[0.06]">
      <h4 className="flex items-center gap-2 px-4 pt-3.5 pb-2 text-xs font-medium text-muted-foreground">
        <Icon aria-hidden className={cn('size-4', directionText(sign))} />
        {tone === 'bullish' ? 'Bullish drivers' : 'Bearish drivers'}
        <span className="tabular-nums">· {factors.length}</span>
        <span className="ml-auto hidden text-[11px] sm:inline">Tap for evidence</span>
      </h4>
      {sorted.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">None identified.</p>
      ) : (
        <ul className="flex flex-col pb-1.5">
          {sorted.map((f, i) => (
            <FactorRow key={i} factor={f} sign={sign} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FactorRow({ factor, sign }: { factor: Factor; sign: number }) {
  const widthPct = Math.round(factor.weight * 100)
  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none">
          <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-snug">{factor.title}</span>
          <span
            role="img"
            aria-label={`Weight ${widthPct}%`}
            className="hidden h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.07] sm:block simple:hidden"
          >
            <span
              className={cn('block h-full rounded-full', directionBg(sign))}
              style={{ width: `${widthPct}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground simple:hidden">
            {widthPct}%
          </span>
          <ChevronDown
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className={PANEL}>
          <p className="px-4 pb-2.5 text-xs leading-relaxed text-muted-foreground">
            {factor.evidence}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function Risks({ risks }: { risks: ForecastOutput['risks'] }) {
  if (risks.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Warning aria-hidden className="size-4 text-amber-400" />
        Key risks
      </h3>
      <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        {risks.map((r, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-snug text-foreground/85">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-amber-400/80" />
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
