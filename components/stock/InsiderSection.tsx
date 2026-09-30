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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  getInsiderTransactions,
  type FinnhubInsiderTx,
} from '@/lib/apis/finnhub'
import { compactNum, usd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { IoPeople as People, IoChevronDown as ChevronDown } from 'react-icons/io5'

const TX_CODE_LABELS: Record<string, string> = {
  P: 'Open-market buy',
  S: 'Open-market sell',
  A: 'Grant / award',
  M: 'Option exercise',
  F: 'Tax withholding',
  G: 'Gift',
  D: 'Sale to issuer',
  X: 'Option exercise',
  C: 'Conversion',
}

const VISIBLE = 5

export async function InsiderSection({ symbol }: { symbol: string }) {
  let txs: FinnhubInsiderTx[]
  try {
    txs = await getInsiderTransactions(symbol, 90)
  } catch (err) {
    console.error('[InsiderSection]', err)
    return <Empty message="Couldn't load insider transactions." />
  }

  if (txs.length === 0) {
    return <Empty message="No insider transactions reported in the last 90 days." />
  }

  const bought = txs.reduce((s, t) => s + Math.max(0, t.change ?? 0), 0)
  const sold = txs.reduce((s, t) => s + Math.max(0, -(t.change ?? 0)), 0)
  const net = bought - sold
  const flow = bought + sold || 1
  const recent = txs
    .slice()
    .sort((a, b) => (b.transactionDate ?? '').localeCompare(a.transactionDate ?? ''))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Insider activity</CardTitle>
        <CardDescription>
          {txs.length} filings in the last 90 days · Finnhub
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={cn('text-2xl font-semibold tracking-tight', directionText(net))}>
                {net >= 0 ? 'Net buying' : 'Net selling'}
              </p>
              <p className="text-xs text-muted-foreground">
                {net >= 0 ? '+' : '−'}
                {compactNum(Math.abs(net))} shares
              </p>
            </div>
            <p className="text-right text-xs tabular-nums text-muted-foreground">
              <span className={directionText(1)}>{compactNum(bought)} bought</span>
              <br />
              <span className={directionText(-1)}>{compactNum(sold)} sold</span>
            </p>
          </div>
          <div
            role="img"
            aria-label={`${compactNum(bought)} shares bought, ${compactNum(sold)} sold`}
            className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.07]"
          >
            {bought > 0 && (
              <div className="rounded-l-full bg-emerald-400/80" style={{ width: `${(bought / flow) * 100}%` }} />
            )}
            {sold > 0 && (
              <div className="rounded-r-full bg-rose-400/80" style={{ width: `${(sold / flow) * 100}%` }} />
            )}
          </div>
        </div>

        <ul className="-mx-5 divide-y divide-border border-t border-border">
          {recent.slice(0, VISIBLE).map((tx, i) => (
            <TxRow key={i} tx={tx} />
          ))}
        </ul>
        {recent.length > VISIBLE && (
          <Collapsible className="-mx-5 -mt-5">
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0">
              <ul className="divide-y divide-border border-t border-border">
                {recent.slice(VISIBLE).map((tx, i) => (
                  <TxRow key={i} tx={tx} />
                ))}
              </ul>
            </CollapsibleContent>
            <CollapsibleTrigger className="group flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-xs font-medium text-primary hover:bg-white/[0.02] focus-visible:outline-none focus-visible:bg-white/[0.04]">
              <span className="group-data-panel-open:hidden">
                Show all {recent.length} filings
              </span>
              <span className="hidden group-data-panel-open:inline">Show fewer</span>
              <ChevronDown
                aria-hidden
                className="size-3.5 transition-transform group-data-panel-open:rotate-180"
              />
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

function TxRow({ tx }: { tx: FinnhubInsiderTx }) {
  const change = tx.change ?? 0
  const date = tx.transactionDate
    ? new Date(`${tx.transactionDate}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—'
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {TX_CODE_LABELS[tx.transactionCode ?? ''] ?? tx.transactionCode ?? 'Filing'} · {date}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-sm font-medium tabular-nums', directionText(change))}>
          {tx.change != null ? `${change > 0 ? '+' : '−'}${compactNum(Math.abs(change))}` : '—'}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {tx.transactionPrice ? `@ ${usd(tx.transactionPrice)}` : ' '}
        </p>
      </div>
    </li>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <Card className="h-full">
      <EmptyState
        icon={People}
        tone="muted"
        title="Insider activity"
        description={message}
        className="py-10"
      />
    </Card>
  )
}
