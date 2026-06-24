import { Suspense } from 'react'
import Link from 'next/link'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeBadge } from '@/components/ui/change-badge'
import { listPositions } from '@/lib/portfolio'
import { getQuote, type FinnhubQuote } from '@/lib/apis/finnhub'
import { AddPositionForm } from '@/components/portfolio/AddPositionForm'
import { DeletePositionButton } from '@/components/portfolio/DeletePositionButton'
import {
  AllocationPie,
  type AllocationSlice,
} from '@/components/portfolio/AllocationPie'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { cn } from '@/lib/utils'

import { usd } from '@/lib/format'
import { IoBriefcase as Suitcase, IoDownload as Download } from 'react-icons/io5'

export default async function PortfolioPage() {
  return (
    <PageContainer>
      <PageHeader icon={Suitcase} title="Portfolio" />
      <CardStack>
        <Suspense fallback={<PortfolioSkeleton />}>
          <PortfolioContent />
        </Suspense>
        <AddPositionForm />
      </CardStack>
    </PageContainer>
  )
}

async function PortfolioContent() {
  const positions = await listPositions()

  if (positions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add positions below to track cost basis and live P/L.
      </p>
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
  const todaysPLPct = totalValue > 0 ? (todaysPL / totalValue) * 100 : 0

  const allocation: AllocationSlice[] = enriched
    .filter((p) => p.quote)
    .map((p) => ({
      symbol: p.symbol,
      value: Number(p.quantity) * p.quote!.c,
    }))

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {positions.length} {positions.length === 1 ? 'position' : 'positions'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total cost" value={usd(totalCost)} />
        <KpiCard label="Total value" value={usd(totalValue)} />
        <KpiCard
          label="Total P/L"
          value={`${totalPL >= 0 ? '+' : ''}${usd(totalPL)}`}
          chip={<ChangeBadge pct={totalPLPct} />}
        />
        <KpiCard
          label="Today's P/L"
          value={`${todaysPL >= 0 ? '+' : ''}${usd(todaysPL)}`}
          chip={totalValue > 0 ? <ChangeBadge pct={todaysPLPct} /> : null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Share of total value by ticker</CardDescription>
          </CardHeader>
          <CardContent>
            {allocation.length > 0 ? (
              <AllocationPie data={allocation} />
            ) : (
              <p className="text-sm py-6 text-center text-muted-foreground">
                No live quotes — allocation unavailable.
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="list" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <CardDescription>
              Cost basis vs live market value
            </CardDescription>
            <CardAction>
              <a
                href="/api/export/portfolio"
                download
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Download aria-hidden className="size-3.5" />
                <span>Export CSV</span>
              </a>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto -mx-1 px-1 [mask-image:linear-gradient(to_right,transparent_0,black_0.5rem,black_calc(100%-0.5rem),transparent_100%)] sm:[mask-image:none]">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <Th>Symbol</Th>
                    <Th align="right">Qty</Th>
                    <Th align="right">Cost</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">Value</Th>
                    <Th align="right">P/L</Th>
                    <Th align="right"></Th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((p, i) => {
                    const qty = Number(p.quantity)
                    const cb = Number(p.cost_basis)
                    const cost = qty * cb
                    const value = p.quote ? qty * p.quote.c : null
                    const pl = value != null ? value - cost : null
                    const plPct =
                      cost > 0 && pl != null ? (pl / cost) * 100 : null
                    const isLast = i === enriched.length - 1
                    return (
                      <tr
                        key={p.id}
                        className={cn(!isLast && 'border-b border-border')}
                      >
                        <td className="py-2 px-2">
                          <Link
                            href={`/stocks/${p.symbol}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {p.symbol}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {qty.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {usd(cb)}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {p.quote ? usd(p.quote.c) : '—'}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {value != null ? usd(value) : '—'}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-2 text-right tabular-nums',
                            pl != null && pl >= 0 && 'text-emerald-400',
                            pl != null && pl < 0 && 'text-rose-400'
                          )}
                        >
                          {pl != null
                            ? `${pl >= 0 ? '+' : ''}${usd(pl)}`
                            : '—'}
                          {plPct != null && (
                            <span className="text-xs ml-1 text-muted-foreground">
                              ({plPct >= 0 ? '+' : ''}
                              {plPct.toFixed(2)}%)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <DeletePositionButton id={p.id} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  chip,
}: {
  label: string
  value: string
  chip?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight break-words">
          {value}
        </p>
        {chip}
      </CardContent>
    </Card>
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
        'pt-2 pb-4 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  )
}
