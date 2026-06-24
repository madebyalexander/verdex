import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { InfoTip } from '@/components/ui/info-tip'
import type { GlossaryKey } from '@/lib/glossary'

/** Horizontal bar marking where `value` sits between `low` and `high`. */
export function RangeBar({
  low,
  high,
  value,
  label,
  info,
}: {
  low: number | null
  high: number | null
  value: number | null
  label?: string
  info?: GlossaryKey
}) {
  if (low == null || high == null || value == null || high <= low) {
    return (
      <span className="text-xs text-muted-foreground">
        {label ? `${label} —` : '—'}
      </span>
    )
  }
  const pct = Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
  const near = pct >= 75 ? 'high' : pct <= 25 ? 'low' : 'mid'
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
          {info && <InfoTip term={info} />}
        </p>
      )}
      <div className="relative h-1.5 rounded-full bg-muted">
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full ring-2 ring-card',
            near === 'high' && 'bg-emerald-400',
            near === 'low' && 'bg-rose-400',
            near === 'mid' && 'bg-primary'
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{usd(low)}</span>
        <span>{usd(high)}</span>
      </div>
    </div>
  )
}
