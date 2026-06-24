import { Card, CardContent } from '@/components/ui/card'
import { getFund13F, type HoldingMove } from '@/lib/apis/sec'
import { INVESTORS } from '@/lib/investors'
import { MoveChips, quarterLabel } from '@/components/investors/MoveChips'

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
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {FEATURED.person} · {FEATURED.firm}
          </span>
          <span className="text-xs text-muted-foreground">
            Recent buys{quarter ? ` · ${quarter}` : ''}
          </span>
        </div>

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
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-48 rounded bg-muted animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
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
