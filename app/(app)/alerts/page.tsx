import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listUserAlerts, type Alert } from '@/lib/alerts'
import { DeleteAlertButton } from '@/components/alerts/DeleteAlertButton'
import { PageHeader } from '@/components/layout/PageHeader'

export default async function AlertsPage() {
  const alerts = await listUserAlerts()

  if (alerts.length === 0) {
    return (
      <main className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
        <PageHeader icon={Bell} title="Price alerts" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span
              aria-hidden
              className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary"
            >
              <Bell className="size-6" />
            </span>
            <h2 className="text-lg font-medium">No alerts yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open a stock detail page and click <strong>Set alert</strong> to
              get notified when the price crosses a threshold.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const active = alerts.filter((a) => !a.triggered_at && a.active)
  const triggered = alerts.filter((a) => a.triggered_at)

  return (
    <main className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon={Bell}
        title="Price alerts"
        description={`${alerts.length} total · ${active.length} active · ${triggered.length} triggered`}
      />

      {active.length > 0 && (
        <Section
          title="Active"
          subtitle="Will fire when you visit the symbol and the price has crossed."
        >
          {active.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </Section>
      )}

      {triggered.length > 0 && (
        <Section title="Triggered">
          {triggered.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </Section>
      )}
    </main>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-xs uppercase tracking-wide font-medium">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
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
      </CardContent>
    </Card>
  )
}
