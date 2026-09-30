import { cn } from '@/lib/utils'

/**
 * Toggleable pill used for sector filters, sentiment filters and range
 * pickers. Active state carries the brand purple.
 */
export function FilterChip({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap ring-1 ring-inset transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-primary/15 text-foreground ring-primary/40 [&_svg]:text-primary'
          : 'bg-white/[0.03] text-muted-foreground ring-white/[0.07] hover:bg-white/[0.06] hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Single-line, horizontally scrollable chip row. Keeps long filter sets
 * (e.g. 10 sectors) on one line on phones instead of wrapping into a wall.
 */
export function ChipRow({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        '-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Compact segmented control (e.g. chart ranges 1M · 3M · 1Y). Renders as a
 * tablist so screen readers announce the current selection.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  isDisabled,
  className,
}: {
  value: T
  options: readonly T[]
  onChange: (next: T) => void
  ariaLabel: string
  isDisabled?: (option: T) => boolean
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.06]',
        className
      )}
    >
      {options.map((option) => {
        const active = option === value
        const disabled = isDisabled?.(option) ?? false
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'h-7 min-w-10 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              'disabled:cursor-not-allowed disabled:opacity-35',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
