import Link from 'next/link'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRecentInsights, type Insight } from '@/lib/insights'
import type { Horizon } from '@/lib/zod-schemas'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'

function confidenceClass(c: Horizon['confidence']) {
  if (c === 'high')
    return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
  if (c === 'medium')
    return 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/20'
  return 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
}

export async function AIInsights() {
  const insights = await getRecentInsights(6)
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            No AI forecasts generated yet. Visit a stock detail page to create one.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((i) => (
        <InsightCard key={i.symbol} insight={i} />
      ))}
    </div>
  )
}

function InsightCard({ insight: i }: { insight: Insight }) {
  const h1m = i.prediction.horizons['1m']
  const topBull = i.prediction.bullish_factors?.[0]
  const topBear = i.prediction.bearish_factors?.[0]

  return (
    <Link
      href={`/stocks/${i.symbol}`}
      className="block transition-opacity hover:opacity-90"
    >
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold tabular-nums text-primary">
              {i.symbol}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'border-transparent ring-1 ring-inset',
                confidenceClass(h1m.confidence)
              )}
            >
              {h1m.confidence}
            </Badge>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {usd(h1m.base)}
            </p>
            <p className="text-xs text-muted-foreground">1-month forecast</p>
          </div>
          <div className="flex flex-col gap-1">
            {topBull && (
              <p className="text-xs leading-snug line-clamp-1 inline-flex items-center gap-1.5">
                <TrendingUp aria-hidden className="size-3 text-emerald-400 shrink-0" />
                <span className="text-muted-foreground truncate">{topBull.title}</span>
              </p>
            )}
            {topBear && (
              <p className="text-xs leading-snug line-clamp-1 inline-flex items-center gap-1.5">
                <TrendingDown aria-hidden className="size-3 text-rose-400 shrink-0" />
                <span className="text-muted-foreground truncate">{topBear.title}</span>
              </p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {new Date(i.generated_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
