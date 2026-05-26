import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getInsiderTransactions,
  type FinnhubInsiderTx,
} from '@/lib/apis/finnhub'
import { cn } from '@/lib/utils'

const TX_CODE_LABELS: Record<string, string> = {
  P: 'Open-market buy',
  S: 'Open-market sell',
  A: 'Grant / award',
  M: 'Option exercise',
  F: 'Tax payment (shares)',
  G: 'Gift',
  D: 'Sale to issuer',
  X: 'In-the-money exercise',
  C: 'Conversion',
}

function ToneBadge({
  tone,
  children,
}: {
  tone: 'success' | 'danger'
  children: React.ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent ring-1 ring-inset',
        tone === 'success' &&
          'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        tone === 'danger' && 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
      )}
    >
      {children}
    </Badge>
  )
}

export async function InsiderSection({ symbol }: { symbol: string }) {
  let txs: FinnhubInsiderTx[]
  try {
    txs = await getInsiderTransactions(symbol, 90)
  } catch (err) {
    console.error('[InsiderSection]', err)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insider transactions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm py-6 text-center rounded-md text-muted-foreground bg-secondary">
          Couldn&apos;t load insider transactions.
        </CardContent>
      </Card>
    )
  }

  if (txs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insider transactions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm py-6 text-center text-muted-foreground">
          No insider transactions reported in the last 90 days.
        </CardContent>
      </Card>
    )
  }

  const buys = txs.filter((t) => (t.change ?? 0) > 0)
  const sells = txs.filter((t) => (t.change ?? 0) < 0)
  const netShares = txs.reduce((s, t) => s + (t.change ?? 0), 0)
  const recent = txs
    .slice()
    .sort((a, b) =>
      (b.transactionDate ?? '').localeCompare(a.transactionDate ?? '')
    )
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insider transactions</CardTitle>
        <CardDescription>
          {txs.length} {txs.length === 1 ? 'transaction' : 'transactions'} in
          last 90 days · Finnhub
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <ToneBadge tone="success">
            {buys.length} {buys.length === 1 ? 'buy' : 'buys'}
          </ToneBadge>
          <ToneBadge tone="danger">
            {sells.length} {sells.length === 1 ? 'sell' : 'sells'}
          </ToneBadge>
          <ToneBadge tone={netShares >= 0 ? 'success' : 'danger'}>
            Net {netShares >= 0 ? '+' : ''}
            {netShares.toLocaleString()} shares
          </ToneBadge>
        </div>

        <div className="relative overflow-x-auto -mx-1 px-1 [mask-image:linear-gradient(to_right,transparent_0,black_0.5rem,black_calc(100%-0.5rem),transparent_100%)] sm:[mask-image:none]">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <Th>Date</Th>
                <Th>Insider</Th>
                <Th>Type</Th>
                <Th align="right">Shares</Th>
                <Th align="right">Price</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((tx, i) => {
                const isLast = i === recent.length - 1
                const change = tx.change ?? 0
                return (
                  <tr
                    key={i}
                    className={cn(!isLast && 'border-b border-border')}
                  >
                    <td className="py-2 tabular-nums whitespace-nowrap">
                      {tx.transactionDate ?? '—'}
                    </td>
                    <td className="py-2 max-w-[12rem] truncate">{tx.name}</td>
                    <td className="py-2">
                      {TX_CODE_LABELS[tx.transactionCode ?? ''] ??
                        tx.transactionCode ??
                        '—'}
                    </td>
                    <td
                      className={cn(
                        'py-2 text-right tabular-nums',
                        change > 0 && 'text-emerald-400',
                        change < 0 && 'text-rose-400'
                      )}
                    >
                      {tx.change != null
                        ? `${change > 0 ? '+' : ''}${change.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {tx.transactionPrice != null
                        ? `$${tx.transactionPrice.toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
        'py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  )
}
