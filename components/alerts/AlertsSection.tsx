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
import { cn } from '@/lib/utils'

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
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No alerts yet. Open any stock detail page and tap{' '}
          <strong>Set alert</strong> to get notified when the price crosses a
          threshold.
        </CardContent>
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
              <StatChip className="bg-emerald-500/10 text-emerald-400 ring-emerald-500/20">
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
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3">
      <div className="flex items-center gap-x-3 gap-y-1 min-w-0 flex-wrap">
        <Link
          href={`/stocks/${alert.symbol}`}
          className="font-semibold tabular-nums text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
        >
          {alert.symbol}
        </Link>
        <span className="text-sm whitespace-nowrap">
          {alert.condition}{' '}
          <strong className="tabular-nums">
            ${Number(alert.target_price).toFixed(2)}
          </strong>
        </span>
        {alert.triggered_at && (
          <Badge
            variant="outline"
            className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
          >
            triggered {new Date(alert.triggered_at).toLocaleDateString()}
          </Badge>
        )}
      </div>
      <DeleteAlertButton id={alert.id} />
    </div>
  )
}
