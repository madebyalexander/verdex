import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { directionText } from '@/components/ui/change-badge'
import {
  getRecommendations,
  type FinnhubRecommendation,
} from '@/lib/apis/finnhub'
import { cn } from '@/lib/utils'
import { IoPeople as People } from 'react-icons/io5'

function totalAnalysts(r: FinnhubRecommendation): number {
  return r.strongBuy + r.buy + r.hold + r.sell + r.strongSell
}

function avgRating(r: FinnhubRecommendation): number {
  const total = totalAnalysts(r)
  if (total === 0) return 0
  return (
    (r.strongBuy * 5 + r.buy * 4 + r.hold * 3 + r.sell * 2 + r.strongSell * 1) /
    total
  )
}

function consensusLabel(rating: number): string {
  if (rating >= 4.5) return 'Strong buy'
  if (rating >= 3.5) return 'Buy'
  if (rating >= 2.5) return 'Hold'
  if (rating >= 1.5) return 'Sell'
  return 'Strong sell'
}

// Diverging scale: two greens, neutral gray midpoint, amber then rose.
const BUCKETS = [
  { key: 'strongBuy', label: 'Strong buy', bar: 'bg-emerald-500' },
  { key: 'buy', label: 'Buy', bar: 'bg-emerald-400/70' },
  { key: 'hold', label: 'Hold', bar: 'bg-zinc-400/60' },
  { key: 'sell', label: 'Sell', bar: 'bg-rose-400/70' },
  { key: 'strongSell', label: 'Strong sell', bar: 'bg-rose-500' },
] as const

export async function AnalystSection({ symbol }: { symbol: string }) {
  let recs: FinnhubRecommendation[]
  try {
    recs = await getRecommendations(symbol)
  } catch (err) {
    console.error('[AnalystSection]', err)
    return <Empty message="Couldn't load analyst recommendations." />
  }

  const current = recs[0]
  const total = current ? totalAnalysts(current) : 0
  if (!current || total === 0) {
    return <Empty message="No analyst coverage reported for this symbol." />
  }

  const rating = avgRating(current)
  const prev = recs[3] ?? null
  const shift = prev && totalAnalysts(prev) > 0 ? rating - avgRating(prev) : null
  const lean = rating >= 3.5 ? 1 : rating < 2.5 ? -1 : 0
  // Oldest first so the eye reads the trend left-to-right, top-to-bottom.
  const history = recs
    .slice(0, 4)
    .filter((r) => totalAnalysts(r) > 0)
    .reverse()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Analyst consensus</CardTitle>
        <CardDescription>
          {total} analysts · as of {current.period} · Finnhub
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={cn('text-2xl font-semibold tracking-tight', directionText(lean))}>
              {consensusLabel(rating)}
            </p>
            <p className="text-xs text-muted-foreground">
              Average {rating.toFixed(1)} of 5
            </p>
          </div>
          {shift !== null && Math.abs(shift) >= 0.05 && (
            <p className="text-right text-xs text-muted-foreground">
              <span className={cn('font-medium', directionText(shift))}>
                {shift > 0 ? 'Upgraded' : 'Downgraded'} {Math.abs(shift).toFixed(2)}
              </span>
              <br />
              vs 3 months ago
            </p>
          )}
        </div>

        <div
          role="img"
          aria-label={`Analyst distribution: ${BUCKETS.map((b) => `${current[b.key]} ${b.label}`).join(', ')}`}
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
        >
          {BUCKETS.map(({ key, bar }) =>
            current[key] > 0 ? (
              <div
                key={key}
                className={cn('first:rounded-l-full last:rounded-r-full', bar)}
                style={{ width: `${(current[key] / total) * 100}%` }}
              />
            ) : null
          )}
        </div>

        <ul className="flex flex-col gap-1.5">
          {BUCKETS.map(({ key, label, bar }) => {
            const count = current[key]
            const pct = (count / total) * 100
            return (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                <span aria-hidden className={cn('size-2 shrink-0 rounded-full', bar)} />
                <span className="flex-1 text-muted-foreground">{label}</span>
                <span className="w-8 text-right font-medium tabular-nums">{count}</span>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                  {pct.toFixed(0)}%
                </span>
              </li>
            )
          })}
        </ul>

        {history.length > 1 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Rating trend · last {history.length} months
            </p>
            <ul className="flex flex-col gap-1.5">
              {history.map((r) => {
                const t = totalAnalysts(r)
                return (
                  <li key={r.period} className="flex items-center gap-3">
                    <span className="w-9 text-xs text-muted-foreground">
                      {new Date(`${r.period}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full">
                      {BUCKETS.map(({ key, bar }) =>
                        r[key] > 0 ? (
                          <span
                            key={key}
                            className={cn('first:rounded-l-full last:rounded-r-full', bar)}
                            style={{ width: `${(r[key] / t) * 100}%` }}
                          />
                        ) : null
                      )}
                    </span>
                    <span className="w-7 text-right text-xs tabular-nums">
                      {avgRating(r).toFixed(1)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <Card className="h-full">
      <EmptyState
        icon={People}
        tone="muted"
        title="Analyst consensus"
        description={message}
        className="py-10"
      />
    </Card>
  )
}
