import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { getFund13F, type HoldingMove } from '@/lib/apis/sec'
import { INVESTORS } from '@/lib/investors'
import { MoveChips, quarterLabel } from '@/components/investors/MoveChips'
import { InvestorAvatar } from '@/components/investors/InvestorsView'
import { IoChevronForward as ChevronRight } from 'react-icons/io5'

// Featured fund on the dashboard — the full set lives on /investors.
const FEATURED = INVESTORS[0] // Warren Buffett · Berkshire Hathaway

export async function InvestorMoves() {
  let moves: HoldingMove[] = []
  let reportDate: string | null = null
  try {
    const fund = await getFund13F(FEATURED.cik)
    if (fund) {
      moves = fund.notableMoves
      reportDate = fund.reportDate
    }
  } catch {
    moves = []
  }

  const quarter = quarterLabel(reportDate)
  const hasBuys = moves.some(
    (m) => m.action === 'new' || m.action === 'added'
  )

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <Link
          href={`/investors?cik=${FEATURED.cik}`}
          className="group -m-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <InvestorAvatar investor={FEATURED} className="size-10" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">
              {FEATURED.person}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {FEATURED.firm} · latest buys{quarter ? ` · ${quarter}` : ''}
            </span>
          </div>
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        {moves.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load the latest filing. See the Investors page for
            more.
          </p>
        ) : hasBuys ? (
          <MoveChips moves={moves} kind="buy" limit={6} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No new buys in the latest filing. See the Investors page for trims
            & exits.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function InvestorMovesSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-44 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-32 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
