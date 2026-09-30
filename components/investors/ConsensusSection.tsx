'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Consensus, ConsensusStock } from '@/lib/investors-consensus'
import { compactUsd } from '@/lib/format'
import { cn } from '@/lib/utils'

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Llc|Ltd|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m.toUpperCase())
}

export function ConsensusSection() {
  const [data, setData] = useState<Consensus | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const reqId = useRef(0)

  useEffect(() => {
    const myReq = ++reqId.current
    fetch('/api/investors/consensus')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Consensus) => {
        if (myReq !== reqId.current) return
        setData(d)
        setState('ready')
      })
      .catch(() => {
        if (myReq === reqId.current) setState('error')
      })
  }, [])

  return (
    <Card variant="list">
      <CardHeader>
        <CardTitle>What they agree on</CardTitle>
        <CardDescription>
          {state === 'ready' && data
            ? `Most widely held across ${data.fundsCovered} of ${data.totalFunds} tracked investors`
            : 'Most widely held across the tracked investors'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {state === 'loading' && <ConsensusSkeleton />}
        {state === 'error' && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t build consensus from SEC filings right now. Try again
            shortly.
          </p>
        )}
        {state === 'ready' && data && data.stocks.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No overlapping positions across these investors&apos; top holdings.
          </p>
        )}
        {state === 'ready' && data && data.stocks.length > 0 && (
          <ul className="divide-y divide-border">
            {data.stocks.map((s) => (
              <li key={s.cusip}>
                <ConsensusRow stock={s} maxFunds={data.stocks[0].funds} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ConsensusRow({
  stock,
  maxFunds,
}: {
  stock: ConsensusStock
  maxFunds: number
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{titleCase(stock.issuer)}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(stock.funds / maxFunds) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {stock.funds} funds
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">
          {compactUsd(stock.totalValue)}
        </p>
        <p className="text-[11px] tabular-nums">
          <span className={cn(stock.buying > 0 && 'text-emerald-400')}>
            {stock.buying}↑
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className={cn(stock.selling > 0 && 'text-rose-400')}>
            {stock.selling}↓
          </span>
        </p>
      </div>
    </div>
  )
}

function ConsensusSkeleton() {
  return (
    <ul aria-hidden className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-1.5 w-24 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  )
}
