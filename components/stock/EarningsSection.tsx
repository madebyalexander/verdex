import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getUpcomingEarnings,
  type FinnhubEarningsItem,
} from '@/lib/apis/finnhub'
import { compactUsd } from '@/lib/format'

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
        <CardDescription>
          Upcoming earnings dates and analyst estimates · next 90 days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {upcoming.length === 0 ? (
          <p className="px-6 py-6 text-center text-sm text-muted-foreground">
            No upcoming earnings announced.
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {upcoming.map((e, idx) => (
              <li key={`${e.date}-${idx}`}>
                <EarningsRow earnings={e} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function EarningsRow({ earnings: e }: { earnings: FinnhubEarningsItem }) {
  const d = new Date(e.date)
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const hourLabel = e.hour ? HOUR_LABELS[e.hour] ?? null : null
  const quarterLabel =
    e.quarter && e.year ? `Q${e.quarter} ${e.year}` : null

  return (
    <div className="flex items-center gap-4 px-6 py-3 flex-wrap">
      <div className="flex flex-col gap-0.5 min-w-[8rem] shrink-0">
        <span className="font-semibold text-sm tabular-nums">{dateLabel}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {hourLabel && (
            <span className="text-xs text-muted-foreground">{hourLabel}</span>
          )}
          {quarterLabel && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {quarterLabel}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-x-6 gap-y-1 text-xs flex-wrap text-muted-foreground ml-auto">
        {e.epsEstimate != null && (
          <span>
            EPS est:{' '}
            <span className="tabular-nums font-medium text-foreground">
              ${e.epsEstimate.toFixed(2)}
            </span>
          </span>
        )}
        {e.revenueEstimate != null && (
          <span>
            Rev est:{' '}
            <span className="tabular-nums font-medium text-foreground">
              {compactUsd(e.revenueEstimate)}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
