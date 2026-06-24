import { cn } from '@/lib/utils'

/**
 * Quick-pick chip strip for "fill this price input relative to the current
 * stock price". Used in the alert dialog (above/below current) and in the
 * add-position form (cost basis when opening a position today).
 *
 *   direction = 'above'  →  Current, +1%, +2%, +5%, +10%
 *   direction = 'below'  →  Current, −1%, −2%, −5%, −10%
 *   direction = 'both'   →  Current, ±1%, ±2%, ±5%, ±10%   (compact: ± in one row)
 */

const STEPS = [0.01, 0.02, 0.05, 0.1] as const

type Pick = {
  label: string
  /** Multiplier applied to currentPrice. 1 = at price, 1.05 = +5%, 0.95 = -5%. */
  multiplier: number
}

function buildPicks(direction: 'above' | 'below' | 'both'): Pick[] {
  if (direction === 'above') {
    return STEPS.map((step) => ({
      label: `+${(step * 100).toFixed(0)}%`,
      multiplier: 1 + step,
    }))
  }
  if (direction === 'below') {
    return STEPS.map((step) => ({
      label: `−${(step * 100).toFixed(0)}%`,
      multiplier: 1 - step,
    }))
  }
  // both — interleave so adjacent steps are close in magnitude
  return STEPS.flatMap((step) => [
    { label: `−${(step * 100).toFixed(0)}%`, multiplier: 1 - step },
    { label: `+${(step * 100).toFixed(0)}%`, multiplier: 1 + step },
  ])
}

function formatTargetPrice(value: number): string {
  // Match the alert/cost inputs' `step="0.01"` precision so the input value
  // displays back exactly as the user clicked.
  return value.toFixed(2)
}

export function PriceQuickPicks({
  currentPrice,
  direction,
  value,
  onPick,
  disabled,
  className,
}: {
  currentPrice: number
  direction: 'above' | 'below' | 'both'
  /** The current input value (string). Used to highlight the matching chip. */
  value?: string
  /** Called with the formatted target price string (e.g. "187.32"). */
  onPick: (formattedPrice: string) => void
  disabled?: boolean
  className?: string
}) {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null

  const picks = buildPicks(direction)
  const currentFormatted = formatTargetPrice(currentPrice)
  const activeValue = value?.trim() ?? ''

  return (
    <div
      role="group"
      aria-label="Quick-pick target price"
      className={cn('flex flex-wrap gap-1.5', className)}
    >
      <Chip
        active={activeValue === currentFormatted}
        disabled={disabled}
        onClick={() => onPick(currentFormatted)}
      >
        At ${currentFormatted}
      </Chip>
      {picks.map((p) => {
        const target = formatTargetPrice(currentPrice * p.multiplier)
        return (
          <Chip
            key={p.label}
            active={activeValue === target}
            disabled={disabled}
            onClick={() => onPick(target)}
            title={`$${target}`}
          >
            {p.label}
          </Chip>
        )
      })}
    </div>
  )
}

function Chip({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium tabular-nums ring-1 ring-inset transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        active
          ? 'bg-primary/15 text-primary ring-primary/30'
          : 'bg-secondary text-muted-foreground ring-border hover:bg-secondary/70 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
