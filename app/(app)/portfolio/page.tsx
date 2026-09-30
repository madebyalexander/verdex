import { Suspense } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ChangeText, directionText } from '@/components/ui/change-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { StockLogo } from '@/components/ui/stock-logo'
import { listPositions } from '@/lib/portfolio'
import { getQuote, type FinnhubQuote } from '@/lib/apis/finnhub'
import { AddPositionForm } from '@/components/portfolio/AddPositionForm'
import { DeletePositionButton } from '@/components/portfolio/DeletePositionButton'
import {
  AllocationPie,
  type AllocationSlice,
} from '@/components/portfolio/AllocationPie'
import { PortfolioSkeleton } from '@/components/portfolio/PortfolioSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import {
  IoPieChart as PortfolioIcon,
  IoDownload as Download,
  IoAdd as Plus,
  IoWallet as Wallet,
} from 'react-icons/io5'

export default async function PortfolioPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={PortfolioIcon}
        title="Portfolio"
        description="Live value and profit & loss across the positions you track."
        action={
          <>
            <a
              href="/api/export/portfolio"
              download
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <Download aria-hidden />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
            <a href="#add-position" className={buttonVariants({ size: 'lg' })}>
              <Plus aria-hidden />
              Add position
            </a>
          </>
        }
      />
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioContent />
      </Suspense>
      <section id="add-position" className="scroll-mt-20">
        <AddPositionForm />
      </section>
    </PageContainer>
  )
}

async function PortfolioContent() {
  const positions = await listPositions()

  if (positions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="Start tracking your portfolio"
          description="Add the positions you hold — Verdex values them with live quotes and shows your profit & loss and allocation."
          action={
            <a href="#add-position" className={buttonVariants({ size: 'lg' })}>
              <Plus aria-hidden />
              Add your first position
            </a>
          }
        />
      </Card>
    )
  }

  const enriched = await Promise.all(
    positions.map(async (p) => {
      try {
        const quote = await getQuote(p.symbol)
        return { ...p, quote, error: false as const }
      } catch {
        return {
          ...p,
          quote: null as FinnhubQuote | null,
          error: true as const,
        }
      }
    })
  )

  let totalCost = 0
  let totalValue = 0
  let todaysPL = 0
  for (const p of enriched) {
    const cost = Number(p.quantity) * Number(p.cost_basis)
    totalCost += cost
    if (p.quote) {
      totalValue += Number(p.quantity) * p.quote.c
      todaysPL += Number(p.quantity) * (p.quote.d ?? 0)
    } else {
      totalValue += cost
    }
  }
  const totalPL = totalValue - totalCost
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0
  const prevValue = totalValue - todaysPL
  const todaysPLPct = prevValue > 0 ? (todaysPL / prevValue) * 100 : 0

  const rows = enriched.map((p) => {
    const qty = Number(p.quantity)
    const cb = Number(p.cost_basis)
    const cost = qty * cb
    const value = p.quote ? qty * p.quote.c : null
    const pl = value != null ? value - cost : null
    const plPct = cost > 0 && pl != null ? (pl / cost) * 100 : null
    const weight = value != null && totalValue > 0 ? (value / totalValue) * 100 : null
    return { ...p, qty, cb, cost, value, pl, plPct, weight }
  })
  rows.sort((a, b) => (b.value ?? b.cost) - (a.value ?? a.cost))

  const best = rows
    .filter((r) => r.plPct != null)
    .sort((a, b) => (b.plPct ?? 0) - (a.plPct ?? 0))[0]

  const allocation: AllocationSlice[] = rows
    .filter((r) => r.value != null)
    .map((r) => ({ symbol: r.symbol, value: r.value! }))

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex h-full flex-col justify-between gap-8">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-muted-foreground">Total value</p>
              <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {usd(totalValue)}
              </p>
              <ChangeText
                pct={totalPLPct}
                abs={totalPL}
                label="All time"
                className="text-base"
              />
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
              <Kpi label="Today">
                <ChangeText pct={todaysPLPct} abs={todaysPL} className="text-sm" />
              </Kpi>
              <Kpi label="Total cost">{usd(totalCost)}</Kpi>
              <Kpi label="Positions">{positions.length}</Kpi>
              <Kpi label="Best performer">
                {best ? (
                  <span className="flex items-baseline gap-1.5">
                    <span>{best.symbol}</span>
                    <span className={cn('text-xs', directionText(best.plPct))}>
                      {(best.plPct ?? 0) >= 0 ? '+' : '−'}
                      {Math.abs(best.plPct ?? 0).toFixed(1)}%
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </Kpi>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Share of market value</CardDescription>
          </CardHeader>
          <CardContent>
            {allocation.length > 0 ? (
              <AllocationPie data={allocation} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No live quotes — allocation unavailable.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="list" className="gap-2">
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Cost basis vs live market value</CardDescription>
        </CardHeader>
        <div className="relative overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <Th>Holding</Th>
                <Th align="right">Price</Th>
                <Th align="right">Avg cost</Th>
                <Th align="right">Market value</Th>
                <Th align="right">Total return</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="py-3 pr-3 pl-5">
                    <Link
                      href={`/stocks/${p.symbol}`}
                      className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <StockLogo
                        symbol={p.symbol}
                        className="size-9 rounded-xl text-xs ring-1 ring-inset ring-white/[0.06]"
                      />
                      <span className="flex flex-col">
                        <span className="font-semibold tabular-nums transition-colors group-hover:text-primary">
                          {p.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {p.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                          {p.qty === 1 ? 'share' : 'shares'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {p.quote ? (
                      <span className="flex flex-col items-end">
                        <span>{usd(p.quote.c)}</span>
                        <ChangeText pct={p.quote.dp} showIcon={false} className="text-xs" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {usd(p.cb)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {p.value != null ? (
                      <span className="flex flex-col items-end">
                        <span className="font-medium">{usd(p.value)}</span>
                        {p.weight != null && (
                          <span className="text-xs text-muted-foreground">
                            {p.weight.toFixed(1)}% of portfolio
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {p.pl != null ? (
                      <ChangeText
                        pct={p.plPct}
                        abs={p.pl}
                        showIcon={false}
                        className="justify-end text-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 pl-2 text-right">
                    <DeletePositionButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-[15px] font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={cn(
        'px-3 pt-1 pb-3 font-medium first:pl-5 last:pr-4',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  )
}
