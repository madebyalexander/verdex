import { AIInsightsSkeleton } from '@/components/dashboard/AIInsightsSkeleton'
import { InvestorMovesSkeleton } from '@/components/dashboard/InvestorMoves'
import { MarketPulseSkeleton } from '@/components/dashboard/MarketPulse'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { StockSkeletonRows } from '@/components/market/market-table'
import { Card } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2" aria-hidden>
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-80 max-w-full rounded bg-muted animate-pulse" />
      </div>
      <MarketPulseSkeleton />
      <AIInsightsSkeleton />
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Market overview"
          description="Your watchlist and the largest names in each sector"
        />
        <Card variant="list" className="gap-0 pt-2">
          <StockSkeletonRows />
        </Card>
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Smart money"
          description="What famous funds are buying, from SEC 13F filings"
        />
        <InvestorMovesSkeleton />
      </section>
    </PageContainer>
  )
}
