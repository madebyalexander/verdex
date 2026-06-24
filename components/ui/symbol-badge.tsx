import Link from 'next/link'
import { cn } from '@/lib/utils'
import { StockLogo } from '@/components/ui/stock-logo'
import { IoClose as Xmark } from 'react-icons/io5'

/**
 * Compact pill showing a stock symbol with its real company logo (letter-tile
 * fallback) + ticker text. Used wherever the app lists tickers in a minimized
 * form (compare chips, news article tags, popular-list shortcuts, etc.).
 */
export function SymbolBadge({
  symbol,
  href,
  onRemove,
  active = false,
  size = 'md',
  className,
}: {
  symbol: string
  /** If provided, the badge becomes a link to that route. */
  href?: string
  /** If provided, renders a trailing × button. */
  onRemove?: () => void
  /** Active styling — purple tint instead of neutral. */
  active?: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  const sizing =
    size === 'sm'
      ? 'h-6 pl-1 pr-2 text-xs gap-1.5'
      : 'h-8 pl-1.5 pr-2.5 text-sm gap-2'

  const tileSize = size === 'sm' ? 'size-4 text-[10px]' : 'size-5 text-[11px]'

  const inner = (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-md ring-1 ring-inset transition-colors',
        sizing,
        active
          ? 'bg-primary/10 text-primary ring-primary/30'
          : 'bg-secondary text-foreground ring-border hover:bg-secondary/70',
        className
      )}
    >
      <StockLogo symbol={symbol} className={cn('rounded-sm', tileSize)} />
      <span className="font-medium tabular-nums">{symbol}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove ${symbol}`}
          className="inline-flex items-center justify-center size-4 rounded-sm hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Xmark aria-hidden className="size-3" />
        </button>
      )}
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`Open ${symbol}`}
        className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
      >
        {inner}
      </Link>
    )
  }
  return inner
}
