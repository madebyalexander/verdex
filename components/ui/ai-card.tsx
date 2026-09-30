import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { IoSparkles as Sparks } from 'react-icons/io5'

type Confidence = 'low' | 'medium' | 'high'

/**
 * Card variant for AI-generated content. Same shape as <Card>, on a faintly
 * purple-tinted surface with a crisp purple top edge, so AI output is
 * recognisable at a glance anywhere in the app.
 */
function AICard({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm'
}) {
  return (
    <div
      data-slot="card"
      data-ai="true"
      data-size={size}
      className={cn(
        'group/card surface-highlight relative flex flex-col gap-5 overflow-hidden rounded-[20px] ai-surface py-5 text-sm text-card-foreground ring-1 ring-primary/20',
        'has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-4 data-[size=sm]:py-4',
        className
      )}
      {...props}
    />
  )
}

/** Purple sparkle tile that heads AI sections. */
function AIIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-inset ring-primary/30',
        className
      )}
    >
      <Sparks className="size-4" />
    </span>
  )
}

/**
 * Pill that flags AI-generated content. Every forecast surface must carry one
 * reading "AI estimate — not advice" (docs/ARCHITECTURE.md §15).
 */
function AIBadge({
  children = 'AI',
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/25 gap-1',
        className
      )}
    >
      <Sparks aria-hidden className="size-3" />
      <span>{children}</span>
    </Badge>
  )
}

const CONFIDENCE_LEVEL: Record<Confidence, number> = { low: 1, medium: 2, high: 3 }

/** Three-step meter for the model's stated confidence. */
function ConfidenceMeter({
  confidence,
  showLabel = true,
  verbose = false,
  className,
}: {
  confidence: Confidence
  showLabel?: boolean
  /** Label reads "high confidence" instead of just "high". */
  verbose?: boolean
  className?: string
}) {
  const level = CONFIDENCE_LEVEL[confidence]
  return (
    <span
      role="img"
      aria-label={`${confidence} confidence`}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <span aria-hidden className="inline-flex items-end gap-0.5">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'w-1 rounded-full',
              step === 1 ? 'h-1.5' : step === 2 ? 'h-2.5' : 'h-3.5',
              step <= level ? 'bg-primary' : 'bg-white/12'
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-xs capitalize text-muted-foreground">
          {verbose ? `${confidence} confidence` : confidence}
        </span>
      )}
    </span>
  )
}

/**
 * Forecast band: the low→high range as a track, the base case as a purple
 * marker, and today's price as a white tick — so "how far is the target from
 * here" reads without doing arithmetic.
 */
function ForecastRangeBar({
  low,
  base,
  high,
  current,
  emphasize,
  className,
}: {
  low: number
  base: number
  high: number
  current?: number | null
  /** Bold one end of the band, e.g. the downside for a conservative profile. */
  emphasize?: 'low' | 'high'
  className?: string
}) {
  const hasCurrent = current != null && current > 0
  const min = Math.min(low, hasCurrent ? current : low)
  const max = Math.max(high, hasCurrent ? current : high)
  const span = max - min || 1
  const pos = (v: number) => ((v - min) / span) * 100

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/45"
          style={{ left: `${pos(low)}%`, width: `${Math.max(pos(high) - pos(low), 1)}%` }}
        />
        {hasCurrent && (
          <span
            title={`Current ${usd(current)}`}
            className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/80"
            style={{ left: `${pos(current)}%` }}
          />
        )}
        <span
          title={`Base case ${usd(base)}`}
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
          style={{ left: `${pos(base)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span className={cn(emphasize === 'low' && 'font-semibold text-foreground')}>
          {usd(low)}
        </span>
        <span className={cn(emphasize === 'high' && 'font-semibold text-foreground')}>
          {usd(high)}
        </span>
      </div>
    </div>
  )
}

export { AICard, AIIcon, AIBadge, ConfidenceMeter, ForecastRangeBar }
export type { Confidence }
