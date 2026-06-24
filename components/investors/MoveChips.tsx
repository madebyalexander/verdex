import type { HoldingMove } from '@/lib/apis/sec'
import { cn } from '@/lib/utils'
import { compactUsd } from '@/lib/format'
import { IoArrowUp as ArrowUp, IoArrowDown as ArrowDown } from 'react-icons/io5'

function compactShares(n: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(n))
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Llc|Ltd|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m.toUpperCase())
}

/** Quarter label like "Q1 2025" from a 13F report date (YYYY-MM-DD). */
export function quarterLabel(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
}

/** Estimated dollar amount transacted this quarter for a position. */
function txAmount(m: HoldingMove): number | null {
  if (m.action === 'new') return m.value
  if (m.action === 'exited') return null // value unknown without price history
  if (m.shares > 0) return m.value * (Math.abs(m.deltaShares) / m.shares)
  return null
}

export function MoveChips({
  moves,
  kind,
  limit,
}: {
  moves: HoldingMove[]
  kind: 'buy' | 'sell'
  limit?: number
}) {
  let list = moves.filter((m) =>
    kind === 'buy'
      ? m.action === 'new' || m.action === 'added'
      : m.action === 'reduced' || m.action === 'exited'
  )
  if (limit) list = list.slice(0, limit)

  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No {kind === 'buy' ? 'buys' : 'sells'} reported this quarter.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((m) => (
        <MoveChip key={m.cusip} move={m} kind={kind} />
      ))}
    </div>
  )
}

function MoveChip({ move, kind }: { move: HoldingMove; kind: 'buy' | 'sell' }) {
  const isBuy = kind === 'buy'
  const Icon = isBuy ? ArrowUp : ArrowDown
  const amount = txAmount(move)

  // Amount label: exact for brand-new buys, "~" for partial adds/trims,
  // share count for full exits (dollar value isn't derivable).
  let amountLabel: string
  if (move.action === 'exited') {
    amountLabel = `${compactShares(move.prevShares)} sh`
  } else if (move.action === 'new') {
    amountLabel = amount != null ? compactUsd(amount) : ''
  } else {
    amountLabel = amount != null ? `~${compactUsd(amount)}` : ''
  }

  const tagLabel =
    move.action === 'new'
      ? 'New'
      : move.action === 'exited'
        ? 'Exited'
        : null

  return (
    <span
      title={`${titleCase(move.issuer)} · ${
        isBuy ? '+' : '−'
      }${compactShares(move.deltaShares)} shares`}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full text-xs ring-1 ring-inset',
        isBuy
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25'
          : 'bg-rose-500/10 text-rose-400 ring-rose-500/25'
      )}
    >
      <Icon aria-hidden className="size-3 shrink-0" />
      <span className="font-medium text-foreground/90 max-w-[10rem] truncate">
        {titleCase(move.issuer)}
      </span>
      {amountLabel && (
        <span className="tabular-nums opacity-90">{amountLabel}</span>
      )}
      {tagLabel && (
        <span
          className={cn(
            'inline-flex items-center h-4 px-1 rounded text-[10px] font-semibold uppercase tracking-wide',
            isBuy ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          )}
        >
          {tagLabel}
        </span>
      )}
    </span>
  )
}
