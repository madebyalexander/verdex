import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getRecommendations,
  type FinnhubRecommendation,
} from '@/lib/apis/finnhub'
import { cn } from '@/lib/utils'
import { IoArrowDown as ArrowDown, IoArrowUp as ArrowUp } from 'react-icons/io5'

function totalAnalysts(r: FinnhubRecommendation): number {
  return r.strongBuy + r.buy + r.hold + r.sell + r.strongSell
}

function avgRating(r: FinnhubRecommendation): number {
  const total = totalAnalysts(r)
  if (total === 0) return 0
  return (
    (r.strongBuy * 5 +
      r.buy * 4 +
      r.hold * 3 +
      r.sell * 2 +
      r.strongSell * 1) /
    total
  )
}

const BUCKETS = [
  { key: 'strongBuy', label: 'Strong Buy', color: '#10B981' }, // emerald-500
  { key: 'buy', label: 'Buy', color: '#34D399' }, // emerald-400
  { key: 'hold', label: 'Hold', color: '#A1A1AA' }, // zinc-400
  { key: 'sell', label: 'Sell', color: '#FBBF24' }, // amber-400
  { key: 'strongSell', label: 'Strong Sell', color: '#F43F5E' }, // rose-500
] as const

export async function AnalystSection({ symbol }: { symbol: string }) {
  let recs: FinnhubRecommendation[]
  try {
    recs = await getRecommendations(symbol)
  } catch (err) {
    console.error('[AnalystSection]', err)
    return <ErrorCard message="Couldn't load analyst recommendations." />
  }

  if (recs.length === 0) {
    return <EmptyCard message="No analyst data available for this symbol." />
  }

  const current = recs[0]
  const total = totalAnalysts(current)
  if (total === 0) {
    return <EmptyCard message="No analyst data available for this symbol." />
  }

  const prev3mo = recs[3] ?? null
  const ratingNow = avgRating(current)
  const ratingThen =
    prev3mo && totalAnalysts(prev3mo) > 0 ? avgRating(prev3mo) : null
  const ratingShift = ratingThen !== null ? ratingNow - ratingThen : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
        <CardDescription>
          {total} analysts · period {current.period} · Finnhub
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl font-semibold tabular-nums">
            {ratingNow.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/ 5.0 average</span>
          {ratingShift !== null && Math.abs(ratingShift) > 0.05 && (
            <RatingShiftBadge shift={ratingShift} />
          )}
        </div>

        <div
          role="img"
          aria-label={`Analyst distribution: ${BUCKETS.map(
            (b) => `${current[b.key]} ${b.label}`
          ).join(', ')}`}
          className="flex h-3 rounded-md overflow-hidden bg-muted"
        >
          {BUCKETS.map(({ key, label, color }) => {
            const count = current[key]
            if (count === 0) return null
            const pct = (count / total) * 100
            return (
              <div
                key={key}
                style={{ background: color, width: `${pct}%` }}
                title={`${label}: ${count}`}
              />
            )
          })}
        </div>

        <div className="grid grid-cols-5 gap-2 text-xs">
          {BUCKETS.map(({ key, label, color }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ background: color }}
                />
                <span className="truncate text-muted-foreground">{label}</span>
              </div>
              <span className="font-semibold tabular-nums">
                {current[key]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RatingShiftBadge({ shift }: { shift: number }) {
  const isUp = shift >= 0
  const Icon = isUp ? ArrowUp : ArrowDown
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent ring-1 ring-inset gap-1',
        isUp
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
      )}
    >
      <Icon aria-hidden className="size-3" />
      <span className="tabular-nums">
        {isUp ? '+' : ''}
        {shift.toFixed(2)} vs 3mo
      </span>
    </Badge>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
      </CardHeader>
      <CardContent className="text-sm py-6 text-center rounded-md text-muted-foreground bg-secondary">
        {message}
      </CardContent>
    </Card>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
      </CardHeader>
      <CardContent className="text-sm py-6 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}
