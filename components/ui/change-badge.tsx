import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { IoArrowDown as ArrowDown, IoArrowUp as ArrowUp } from 'react-icons/io5'

/**
 * Single source of the semantic up/down palette (emerald = up, rose = down).
 * Import these instead of inlining emerald/rose classes elsewhere.
 */
export function directionText(value: number | null | undefined): string {
  if (value == null || value === 0) return 'text-muted-foreground'
  return value > 0 ? 'text-emerald-400' : 'text-rose-400'
}

export function directionBg(value: number | null | undefined): string {
  if (value == null) return 'bg-muted-foreground/40'
  return value >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
}

export function ChangeBadge({
  pct,
  size = 'sm',
}: {
  pct: number | null
  size?: 'sm' | 'xs'
}) {
  if (pct === null) return null
  const isUp = pct >= 0
  const Icon = isUp ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-0.5 rounded-md font-medium tabular-nums',
        size === 'xs'
          ? 'px-1.5 py-0.5 text-[11px]'
          : 'px-2 py-0.5 text-xs',
        isUp
          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20'
      )}
    >
      <Icon
        aria-hidden
        className={size === 'xs' ? 'size-2.5' : 'size-3'}
      />
      <span>
        {isUp ? '+' : ''}
        {pct.toFixed(2)}%
      </span>
    </span>
  )
}

/**
 * Inline, pill-less price delta — "+$2.31 (+1.24%)". Used next to large
 * price figures where a pill would compete with the number itself.
 */
export function ChangeText({
  pct,
  abs,
  label,
  showIcon = true,
  className,
}: {
  pct: number | null | undefined
  /** Absolute change in USD. Omitted → percent only. */
  abs?: number | null
  /** Trailing muted context, e.g. "Today" or "Past 3 months". */
  label?: React.ReactNode
  showIcon?: boolean
  className?: string
}) {
  if (pct == null || !Number.isFinite(pct)) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }
  const isUp = pct >= 0
  const Icon = isUp ? ArrowUp : ArrowDown
  const sign = isUp ? '+' : '−'
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 font-medium tabular-nums',
        className
      )}
    >
      <span className={cn('inline-flex items-center gap-1', directionText(pct))}>
        {showIcon && <Icon aria-hidden className="size-[0.8em]" />}
        {abs != null && Number.isFinite(abs) && (
          <span>
            {sign}
            {usd(Math.abs(abs))}
          </span>
        )}
        <span>
          {abs != null && Number.isFinite(abs) ? '(' : ''}
          {sign}
          {Math.abs(pct).toFixed(2)}%
          {abs != null && Number.isFinite(abs) ? ')' : ''}
        </span>
      </span>
      {label && <span className="font-normal text-muted-foreground">{label}</span>}
    </span>
  )
}
