import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { StockLogo } from '@/components/ui/stock-logo'
import { listUserAlerts, type Alert } from '@/lib/alerts'
import { getQuote } from '@/lib/apis/finnhub'
import { DeleteAlertButton } from '@/components/alerts/DeleteAlertButton'
import { usd } from '@/lib/format'
import {
  IoNotifications as Bell,
  IoArrowUp as ArrowUp,
  IoArrowDown as ArrowDown,
} from 'react-icons/io5'

export async function AlertsSection() {
  const alerts = await listUserAlerts()

  if (alerts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Bell}
          tone="muted"
          title="No price alerts yet"
          description="Open any stock and tap the bell to get notified when it crosses a price you choose."
          className="py-10"
        />
      </Card>
    )
  }

  // One cached quote per symbol, so each alert can say how far away it is.
  const symbols = [...new Set(alerts.map((a) => a.symbol))]
  const prices = new Map(
    await Promise.all(
      symbols.map(async (s) => {
        try {
          return [s, (await getQuote(s)).c] as const
        } catch {
          return [s, null] as const
        }
      })
    )
  )

  const active = alerts.filter((a) => !a.triggered_at && a.active)
  const triggered = alerts.filter((a) => a.triggered_at)

  return (
    <Card variant="list" className="gap-0 py-0">
      <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
        {active.length} active
        {triggered.length > 0 && ` · ${triggered.length} triggered`}
      </p>
      <ul className="divide-y divide-border">
        {[...active, ...triggered].map((a) => (
          <li key={a.id}>
            <AlertRow alert={a} price={prices.get(a.symbol) ?? null} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AlertRow({ alert, price }: { alert: Alert; price: number | null }) {
  const above = alert.condition === 'above'
  const Arrow = above ? ArrowUp : ArrowDown
  const target = Number(alert.target_price)
  // Positive = still needs to move toward the target; ≤ 0 = already crossed.
  const remaining =
    price && price > 0
      ? ((above ? target - price : price - target) / price) * 100
      : null

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Link
        href={`/stocks/${alert.symbol}`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <StockLogo
          symbol={alert.symbol}
          className="size-9 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
        />
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold tabular-nums transition-colors group-hover:text-primary">
              {alert.symbol}
            </span>
            <Arrow aria-hidden className="size-3 text-muted-foreground" />
            <span className="font-medium tabular-nums">{usd(target)}</span>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {alert.triggered_at
              ? `${above ? 'Rose above' : 'Fell below'} target`
              : remaining == null
                ? above
                  ? 'Alerts when it rises above'
                  : 'Alerts when it falls below'
                : remaining <= 0
                  ? 'Target reached — fires on your next visit'
                  : `${remaining.toFixed(1)}% to go · now ${usd(price!)}`}
          </span>
        </span>
      </Link>
      {alert.triggered_at && (
        <Badge
          variant="outline"
          className="shrink-0 border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
        >
          Fired{' '}
          {new Date(alert.triggered_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </Badge>
      )}
      <DeleteAlertButton id={alert.id} />
    </div>
  )
}
