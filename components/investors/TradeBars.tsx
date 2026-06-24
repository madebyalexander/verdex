'use client'

import { useMemo, useState } from 'react'
import type { HoldingMove } from '@/lib/apis/sec'
import { compactUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IoSearch as Search, IoChevronDown as ChevronDown } from 'react-icons/io5'

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Llc|Ltd|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m.toUpperCase())
}

function signedCompactUsd(v: number): string {
  return `${v >= 0 ? '+' : '−'}${compactUsd(Math.abs(v))}`
}

const ROWS = 8

type SortKey = 'size' | 'pct' | 'name'
const SORT_LABEL: Record<SortKey, string> = {
  size: 'Trade size',
  pct: '% change',
  name: 'Name A–Z',
}

const MIN_OPTIONS = [
  { label: 'Any size', value: 0 },
  { label: '≥ $10M', value: 1e7 },
  { label: '≥ $100M', value: 1e8 },
  { label: '≥ $1B', value: 1e9 },
]

const TRIGGER_CLS =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

/**
 * Full-width magnitude bars for one side of a fund's quarter, with in-fund
 * controls: search by name, sort (trade size / % change / name), a minimum
 * trade size, and show-all beyond the default top rows.
 */
export function TradeBars({
  moves,
  kind,
}: {
  moves: HoldingMove[]
  kind: 'buy' | 'sell'
}) {
  const isBuy = kind === 'buy'
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('size')
  const [minSize, setMinSize] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const side = useMemo(
    () =>
      moves.filter(
        (m) =>
          Number.isFinite(m.tradeValue) &&
          (isBuy ? m.tradeValue > 0 : m.tradeValue < 0)
      ),
    [moves, isBuy]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = side
      .filter((m) => Math.abs(m.tradeValue) >= minSize)
      .filter((m) => (q ? titleCase(m.issuer).toLowerCase().includes(q) : true))
    return [...rows].sort((a, b) => {
      if (sortBy === 'name')
        return titleCase(a.issuer).localeCompare(titleCase(b.issuer))
      if (sortBy === 'pct') {
        const pa = a.deltaPct === null ? Infinity : Math.abs(a.deltaPct)
        const pb = b.deltaPct === null ? Infinity : Math.abs(b.deltaPct)
        return pb - pa
      }
      return Math.abs(b.tradeValue) - Math.abs(a.tradeValue)
    })
  }, [side, query, minSize, sortBy])

  if (side.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No {isBuy ? 'buys' : 'sells'} in the latest filing.
      </p>
    )
  }

  const max = filtered.length
    ? Math.max(...filtered.map((m) => Math.abs(m.tradeValue)))
    : 1
  const visible = expanded ? filtered : filtered.slice(0, ROWS)
  const hidden = filtered.length - visible.length

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[9rem] flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name…"
            aria-label="Filter holdings by name"
            className="h-8 pl-8 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className={TRIGGER_CLS}>
            Sort: {SORT_LABEL[sortBy]}
            <ChevronDown aria-hidden className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setSortBy(k)}>
                {SORT_LABEL[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={TRIGGER_CLS}>
            {MIN_OPTIONS.find((o) => o.value === minSize)?.label ?? 'Any size'}
            <ChevronDown aria-hidden className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MIN_OPTIONS.map((o) => (
              <DropdownMenuItem key={o.value} onClick={() => setMinSize(o.value)}>
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No {isBuy ? 'buys' : 'sells'} match these filters.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {visible.map((m) => (
            <Row key={m.cusip} move={m} max={max} isBuy={isBuy} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Estimated USD traded vs. the prior quarter&apos;s 13F.
        </p>
        {hidden > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Show all {filtered.length}
          </button>
        ) : expanded && filtered.length > ROWS ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Show less
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Row({
  move,
  max,
  isBuy,
}: {
  move: HoldingMove
  max: number
  isBuy: boolean
}) {
  const name = titleCase(move.issuer)
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
      <span className="truncate text-xs font-medium" title={name}>
        {name}
      </span>
      <div className="flex h-5 items-center">
        <div
          className={cn(
            'h-2.5 min-w-[4px] rounded-full',
            isBuy ? 'bg-emerald-400/85' : 'bg-rose-400/85'
          )}
          style={{ width: `${(Math.abs(move.tradeValue) / max) * 100}%` }}
        />
      </div>
      <span className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            isBuy ? 'text-emerald-400' : 'text-rose-400'
          )}
        >
          {signedCompactUsd(move.tradeValue)}
        </span>
        <span className="text-[10px] text-muted-foreground">{move.action}</span>
      </span>
    </div>
  )
}
