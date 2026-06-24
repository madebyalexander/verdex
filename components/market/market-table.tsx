import Link from 'next/link'
import { StockLogo } from '@/components/ui/stock-logo'
import { ChangeBadge } from '@/components/ui/change-badge'
import { RangeBar } from '@/components/ui/range-bar'
import { Sparkline } from '@/components/dashboard/Sparkline'
import type { MarketStock } from '@/lib/market-universe'
import { cn } from '@/lib/utils'
import { compactUsd, usd } from '@/lib/format'
import { IoChevronForward as NavArrowRight } from 'react-icons/io5'

// Shared responsive grid. Track count per breakpoint matches the number of
// VISIBLE cells (hidden cells are display:none so they leave grid layout).
//   mobile: Stock | Last | →
//   sm:     + Mkt cap
//   md:     + 30d trend
//   lg:     + 52-week range + P/E
export const GRID =
  'grid items-center gap-10 grid-cols-[1.2fr_1fr_auto] sm:grid-cols-[1.2fr_1fr_1fr_auto] md:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto] lg:grid-cols-[1.2fr_1.4fr_1.6fr_1fr_1fr_0.7fr_auto]'

export function MarketTableHeader() {
  return (
    <div
      className={cn(
        GRID,
        'px-4 pb-4 text-[11px] uppercase tracking-wide font-medium text-muted-foreground'
      )}
    >
      <span className="min-w-0">Stock</span>
      <span className="hidden md:block text-start">30d trend</span>
      <span className="hidden lg:block">52-week range</span>
      <span className="text-right">Last</span>
      <span className="hidden sm:block text-right">Mkt cap</span>
      <span className="hidden lg:block text-right">P/E</span>
      <span className="w-4" aria-hidden />
    </div>
  )
}

export function StockRow({ stock }: { stock: MarketStock }) {
  return (
    <Link
      href={`/stocks/${stock.symbol}`}
      className={cn(
        GRID,
        'group px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:bg-secondary'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <StockLogo
          symbol={stock.symbol}
          className="size-7 rounded-md text-[11px]"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold tabular-nums">
            {stock.symbol}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {stock.name}
          </span>
        </div>
      </div>

      <div className="hidden md:block h-9 min-w-0">
        {stock.closes.length >= 2 ? (
          <Sparkline data={stock.closes} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </div>

      <div className="hidden lg:block min-w-0">
        <RangeBar
          low={stock.week52Low}
          high={stock.week52High}
          value={stock.price}
        />
      </div>

      <div className="flex flex-col items-end gap-1">
        {stock.price != null ? (
          <>
            <span className="text-sm font-semibold tabular-nums">
              {usd(stock.price)}
            </span>
            <ChangeBadge pct={stock.changePct} size="xs" />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      <div className="hidden sm:block text-right text-sm tabular-nums">
        {stock.marketCap != null ? (
          compactUsd(stock.marketCap)
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      <div className="hidden lg:block text-right text-sm tabular-nums">
        {stock.pe != null ? (
          stock.pe.toFixed(1)
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      <NavArrowRight
        aria-hidden
        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0"
      />
    </Link>
  )
}

export function StockSkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={cn(GRID, 'px-4 py-3')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-md bg-muted animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="hidden md:block h-7 rounded bg-muted animate-pulse" />
          <div className="hidden lg:block h-4 rounded bg-muted animate-pulse" />
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
            <div className="h-3 w-10 rounded bg-muted animate-pulse" />
          </div>
          <div className="hidden sm:block h-3.5 rounded bg-muted animate-pulse" />
          <div className="hidden lg:block h-3.5 rounded bg-muted animate-pulse" />
          <div className="w-4" />
        </li>
      ))}
    </ul>
  )
}
