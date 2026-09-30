import Link from 'next/link'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listUserAlerts, type Alert } from '@/lib/alerts'
import { DeleteAlertButton } from '@/components/alerts/DeleteAlertButton'
import { EmptyState } from '@/components/ui/empty-state'
import { StockLogo } from '@/components/ui/stock-logo'
import { cn } from '@/lib/utils'
import {
  IoNotifications as Bell,
  IoArrowUp as ArrowUp,
  IoArrowDown as ArrowDown,
} from 'react-icons/io5'

function StatChip({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset',
        className
      )}
    >
      {children}
    </span>
  )
}

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

  const active = alerts.filter((a) => !a.triggered_at && a.active)
  const triggered = alerts.filter((a) => a.triggered_at)

  return (
    <>
      {active.length > 0 && (
        <Card variant="list">
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>
              Will fire when you visit the symbol and the price has crossed.
            </CardDescription>
            <CardAction className="flex flex-wrap items-center gap-2 self-center">
              <StatChip className="bg-secondary text-muted-foreground ring-border">
                {alerts.length} total
              </StatChip>
              <StatChip className="bg-primary/10 text-primary ring-primary/25">
                {active.length} active
              </StatChip>
              {triggered.length > 0 && (
                <StatChip className="bg-amber-500/10 text-amber-400 ring-amber-500/20">
                  {triggered.length} triggered
                </StatChip>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y divide-border">
              {active.map((a) => (
                <li key={a.id}>
                  <AlertRow alert={a} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {triggered.length > 0 && (
        <Card variant="list">
          <CardHeader>
            <CardTitle>Triggered</CardTitle>
            <CardDescription>
              These have already fired. Delete to clear.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y divide-border">
              {triggered.map((a) => (
                <li key={a.id}>
                  <AlertRow alert={a} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  const above = alert.condition === 'above'
  const Arrow = above ? ArrowUp : ArrowDown
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <Link
        href={`/stocks/${alert.symbol}`}
        className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <StockLogo
          symbol={alert.symbol}
          className="size-9 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
        />
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold tabular-nums transition-colors group-hover:text-primary">
            {alert.symbol}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Arrow aria-hidden className="size-3" />
            {above ? 'Rises above' : 'Falls below'}{' '}
            <strong className="font-semibold text-foreground tabular-nums">
              ${Number(alert.target_price).toFixed(2)}
            </strong>
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {alert.triggered_at && (
          <Badge
            variant="outline"
            className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
          >
            Fired {new Date(alert.triggered_at).toLocaleDateString()}
          </Badge>
        )}
        <DeleteAlertButton id={alert.id} />
      </div>
    </div>
  )
}
