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
  'grid items-center gap-4 sm:gap-6 lg:gap-8 grid-cols-[1.4fr_1fr_auto] sm:grid-cols-[1.4fr_1fr_1fr_auto] md:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto] lg:grid-cols-[1.4fr_1.2fr_1.4fr_1fr_1fr_0.6fr_auto]'

// Same grid minus the 30d-trend track, for lists fetched without sparklines
// (the paginated Markets feed skips them to stay inside Alpha Vantage limits).
const GRID_NO_TREND =
  'grid items-center gap-4 sm:gap-6 lg:gap-8 grid-cols-[1.4fr_1fr_auto] sm:grid-cols-[1.4fr_1fr_1fr_auto] lg:grid-cols-[1.4fr_1.6fr_1fr_1fr_0.6fr_auto]'

const gridFor = (trend: boolean) => (trend ? GRID : GRID_NO_TREND)

export function MarketTableHeader({ trend = true }: { trend?: boolean }) {
  return (
    <div
      className={cn(
        gridFor(trend),
        'px-5 pb-3 text-xs font-medium text-muted-foreground'
      )}
    >
      <span className="min-w-0">Stock</span>
      {trend && <span className="hidden md:block text-start">30d trend</span>}
      <span className="hidden lg:block">52-week range</span>
      <span className="text-right">Last</span>
      <span className="hidden sm:block text-right">Mkt cap</span>
      <span className="hidden lg:block text-right">P/E</span>
      <span className="w-4" aria-hidden />
    </div>
  )
}

export function StockRow({
  stock,
  trend = true,
}: {
  stock: MarketStock
  trend?: boolean
}) {
  return (
    <Link
      href={`/stocks/${stock.symbol}`}
      className={cn(
        gridFor(trend),
        'group px-5 py-3.5 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:bg-white/[0.04]'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <StockLogo
          symbol={stock.symbol}
          className="size-9 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold tabular-nums group-hover:text-primary transition-colors">
            {stock.symbol}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {stock.name}
          </span>
        </div>
      </div>

      {trend && (
        <div className="hidden md:block h-9 min-w-0">
          {stock.closes.length >= 2 ? (
            <Sparkline data={stock.closes} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
      )}

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
        className="size-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-foreground shrink-0"
      />
    </Link>
  )
}

export function StockSkeletonRows({
  count = 5,
  trend = true,
}: {
  count?: number
  trend?: boolean
}) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={cn(gridFor(trend), 'px-5 py-3.5')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-muted animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          {trend && <div className="hidden md:block h-7 rounded bg-muted animate-pulse" />}
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
