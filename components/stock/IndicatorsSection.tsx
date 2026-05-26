import { Check, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDailyOhlcv, AlphaVantageError } from '@/lib/apis/alpha-vantage'
import {
  summarizeIndicators,
  type IndicatorsSummary,
} from '@/lib/indicators'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'

export async function IndicatorsSection({ symbol }: { symbol: string }) {
  let summary: IndicatorsSummary
  try {
    const bars = await getDailyOhlcv(symbol)
    summary = summarizeIndicators(bars)
  } catch (err) {
    const message =
      err instanceof AlphaVantageError
        ? err.message
        : 'Failed to compute indicators.'
    return <ErrorCard message={message} />
  }

  if (summary.bars_analyzed === 0) {
    return <ErrorCard message="No price data to analyze." />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical indicators</CardTitle>
        <CardDescription>
          Computed locally from {summary.bars_analyzed} daily bars
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <IndicatorTile
            label="RSI (14)"
            value={summary.rsi_14?.toFixed(1) ?? '—'}
            chip={
              summary.signals.rsi ? (
                <ToneBadge tone={rsiTone(summary.signals.rsi)}>
                  {summary.signals.rsi}
                </ToneBadge>
              ) : null
            }
          />
          <IndicatorTile
            label="MACD"
            value={summary.macd ? summary.macd.line.toFixed(2) : '—'}
            chip={
              summary.signals.macd ? (
                <ToneBadge
                  tone={
                    summary.signals.macd === 'bullish' ? 'success' : 'danger'
                  }
                >
                  {summary.signals.macd}
                </ToneBadge>
              ) : null
            }
          />
          <IndicatorTile
            label="ATR (14)"
            value={summary.atr_14 ? usd(summary.atr_14) : '—'}
            sublabel="avg true range"
          />
          <IndicatorTile
            label="Range position"
            value={
              summary.price_vs_range_pct != null
                ? `${summary.price_vs_range_pct.toFixed(0)}%`
                : '—'
            }
            sublabel={`of ${summary.bars_analyzed}-day range`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
              Moving averages
            </p>
            <SmaRow
              period={20}
              value={summary.sma_20}
              position={summary.signals.price_vs_sma_20}
            />
            <SmaRow
              period={50}
              value={summary.sma_50}
              position={summary.signals.price_vs_sma_50}
            />
            <SmaRow
              period={200}
              value={summary.sma_200}
              position={summary.signals.price_vs_sma_200}
            />
            {summary.signals.sma_cross_50_200 &&
              summary.signals.sma_cross_50_200 !== 'neither' && (
                <ToneBadge
                  tone={
                    summary.signals.sma_cross_50_200 === 'golden'
                      ? 'success'
                      : 'danger'
                  }
                >
                  {summary.signals.sma_cross_50_200 === 'golden' ? (
                    <Check aria-hidden className="size-3" />
                  ) : (
                    <X aria-hidden className="size-3" />
                  )}
                  <span>
                    {summary.signals.sma_cross_50_200 === 'golden'
                      ? 'Golden cross (SMA50 > SMA200)'
                      : 'Death cross (SMA50 < SMA200)'}
                  </span>
                </ToneBadge>
              )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
              Bollinger bands (20, 2σ)
            </p>
            {summary.bollinger ? (
              <>
                <BollingerRow label="Upper" value={summary.bollinger.upper} />
                <BollingerRow label="Middle" value={summary.bollinger.middle} />
                <BollingerRow label="Lower" value={summary.bollinger.lower} />
                {summary.signals.bollinger && (
                  <ToneBadge
                    tone={
                      summary.signals.bollinger === 'middle'
                        ? 'neutral'
                        : 'warning'
                    }
                  >
                    Price near{' '}
                    {summary.signals.bollinger === 'near_upper'
                      ? 'upper band'
                      : summary.signals.bollinger === 'near_lower'
                        ? 'lower band'
                        : 'middle'}
                  </ToneBadge>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function rsiTone(
  s: 'oversold' | 'neutral' | 'overbought'
): 'success' | 'danger' | 'neutral' {
  return s === 'overbought' ? 'danger' : s === 'oversold' ? 'success' : 'neutral'
}

function ToneBadge({
  tone,
  children,
}: {
  tone: 'success' | 'danger' | 'warning' | 'neutral'
  children: React.ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent ring-1 ring-inset w-fit gap-1',
        tone === 'success' &&
          'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        tone === 'danger' && 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
        tone === 'warning' &&
          'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        tone === 'neutral' && 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/20'
      )}
    >
      {children}
    </Badge>
  )
}

function IndicatorTile({
  label,
  value,
  chip,
  sublabel,
}: {
  label: string
  value: string
  chip?: React.ReactNode
  sublabel?: string
}) {
  return (
    <div className="p-3 rounded-md flex flex-col gap-1 bg-secondary">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {chip ?? (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )
}

function SmaRow({
  period,
  value,
  position,
}: {
  period: number
  value: number | null
  position: 'above' | 'below' | null
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">SMA {period}</span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums font-medium">
          {value != null ? usd(value) : 'n/a'}
        </span>
        {position && (
          <ToneBadge tone={position === 'above' ? 'success' : 'danger'}>
            price {position}
          </ToneBadge>
        )}
      </div>
    </div>
  )
}

function BollingerRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{usd(value)}</span>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical indicators</CardTitle>
      </CardHeader>
      <CardContent className="text-sm py-6 text-center rounded-md text-muted-foreground bg-secondary">
        {message}
      </CardContent>
    </Card>
  )
}
