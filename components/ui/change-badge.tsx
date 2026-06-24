import { cn } from '@/lib/utils'
import { IoArrowDown as ArrowDown, IoArrowUp as ArrowUp } from 'react-icons/io5'

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
