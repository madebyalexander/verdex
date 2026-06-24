import { cache } from '@/lib/cache'
import { getFund13F } from '@/lib/apis/sec'
import { INVESTORS } from '@/lib/investors'

export type ConsensusStock = {
  issuer: string
  cusip: string
  /** How many tracked funds hold it among their top positions. */
  funds: number
  /** Summed position value across those funds (USD). */
  totalValue: number
  /** Funds that added/opened it this quarter. */
  buying: number
  /** Funds that trimmed/exited it this quarter. */
  selling: number
}

export type Consensus = {
  stocks: ConsensusStock[]
  fundsCovered: number
  totalFunds: number
}

/** Run an async mapper over items with bounded concurrency. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let idx = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const i = idx++
        if (i >= items.length) break
        out[i] = await fn(items[i])
      }
    })
  )
  return out
}

/**
 * Cross-fund consensus: the stocks most widely held among the tracked
 * investors' top positions, with how many are buying vs. selling this quarter.
 * Fetches every fund's 13F (each individually cached) with bounded concurrency,
 * then caches the aggregate for a day so the heavy pass runs at most once.
 */
export async function getInvestorConsensus(): Promise<Consensus> {
  return cache('sec:consensus:v1', 24 * 3600, async () => {
    const results = await mapLimit(INVESTORS, 4, async (inv) => {
      try {
        const fund = await getFund13F(inv.cik)
        return fund ? { id: inv.id, fund } : null
      } catch {
        return null
      }
    })
    const ok = results.filter((r): r is NonNullable<typeof r> => r !== null)

    const byCusip = new Map<
      string,
      Omit<ConsensusStock, 'funds'> & { holders: Set<string> }
    >()
    for (const { id, fund } of ok) {
      for (const h of fund.topHoldings) {
        let e = byCusip.get(h.cusip)
        if (!e) {
          e = {
            issuer: h.issuer,
            cusip: h.cusip,
            totalValue: 0,
            buying: 0,
            selling: 0,
            holders: new Set(),
          }
          byCusip.set(h.cusip, e)
        }
        e.holders.add(id)
        e.totalValue += h.value
        if (h.action === 'new' || h.action === 'added') e.buying++
        else if (h.action === 'reduced' || h.action === 'exited') e.selling++
      }
    }

    const stocks: ConsensusStock[] = Array.from(byCusip.values())
      .map(({ holders, ...s }) => ({ ...s, funds: holders.size }))
      .filter((s) => s.funds >= 2)
      .sort((a, b) => b.funds - a.funds || b.totalValue - a.totalValue)
      .slice(0, 12)

    return { stocks, fundsCovered: ok.length, totalFunds: INVESTORS.length }
  })
}
