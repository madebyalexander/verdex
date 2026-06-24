import { AIInsightsSkeleton } from '@/components/dashboard/AIInsightsSkeleton'
import { InvestorMovesSkeleton } from '@/components/dashboard/InvestorMoves'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { IoGrid as Dashboard } from 'react-icons/io5'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <PageHeader
        icon={Dashboard}
        title="Welcome"
        description="Your snapshot of the markets and the stocks you're tracking."
      />
      <CardStack>
        <AIInsightsSkeleton />
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Market overview"
            description="Your watchlist & stocks by sector · tap any row for detail"
          />
          <div className="h-72 rounded-2xl bg-muted/40 animate-pulse" />
        </section>
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Top investors"
            description="What famous funds are buying & selling · from SEC 13F filings"
          />
          <InvestorMovesSkeleton />
        </section>
      </CardStack>
    </PageContainer>
  )
}
