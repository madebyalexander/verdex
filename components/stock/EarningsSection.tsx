import {
  getUpcomingEarnings,
  type FinnhubEarningsItem,
} from '@/lib/apis/finnhub'
import { compactUsd } from '@/lib/format'
import { IoCalendar as Calendar } from 'react-icons/io5'

const HOUR_LABELS: Record<string, string> = {
  bmo: 'Before open',
  amc: 'After close',
  dmh: 'During hours',
}

export async function EarningsSection({ symbol }: { symbol: string }) {
  let items: FinnhubEarningsItem[] = []
  try {
    items = await getUpcomingEarnings(symbol, 90)
  } catch {
    items = []
  }

  // Server component renders once per request; Date.now() is request-scoped.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  // Drop entries already past — Finnhub occasionally returns the day-of event
  // for a few hours; we only care about future reports here.
  const upcoming = items.filter(
    (e) => new Date(e.date).getTime() >= now - 24 * 60 * 60 * 1000
  )

  const next = upcoming[0]
  if (!next) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-3.5 text-sm text-muted-foreground ring-1 ring-white/[0.06]">
        <Calendar aria-hidden className="size-4 shrink-0" />
        No earnings date announced for the next 90 days.
      </div>
    )
  }

  const d = new Date(`${next.date}T00:00:00`)
  const days = Math.max(0, Math.round((d.getTime() - now) / 86_400_000))
  const hourLabel = next.hour ? (HOUR_LABELS[next.hour] ?? null) : null

  return (
    <div className="surface-highlight flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-card px-5 py-4 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
          <Calendar aria-hidden className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">
            Next earnings{next.quarter && next.year ? ` · Q${next.quarter} ${next.year}` : ''}
          </p>
          <p className="text-sm font-semibold">
            {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {hourLabel && <span className="font-normal text-muted-foreground"> · {hourLabel}</span>}
          </p>
        </div>
      </div>
      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-medium tabular-nums ring-1 ring-inset ring-white/[0.08]">
        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
      </span>
      <dl className="ml-auto flex gap-6 text-right">
        {next.epsEstimate != null && (
          <div>
            <dt className="text-xs text-muted-foreground">EPS estimate</dt>
            <dd className="text-sm font-semibold tabular-nums">${next.epsEstimate.toFixed(2)}</dd>
          </div>
        )}
        {next.revenueEstimate != null && (
          <div>
            <dt className="text-xs text-muted-foreground">Revenue estimate</dt>
            <dd className="text-sm font-semibold tabular-nums">{compactUsd(next.revenueEstimate)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
