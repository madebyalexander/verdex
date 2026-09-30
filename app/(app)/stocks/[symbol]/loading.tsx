import { StockHeroSkeleton } from '@/components/stock/StockHeroSkeleton'
import { PriceChartSkeleton } from '@/components/stock/PriceChartSkeleton'
import { QuickStatsStripSkeleton } from '@/components/stock/QuickStatsStripSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function StockLoading() {
  return (
    <PageContainer className="gap-6">
      <StockHeroSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <PriceChartSkeleton />
        </div>
        <QuickStatsStripSkeleton />
      </div>
      <div className="flex h-11 items-end gap-6 border-b border-border pt-2" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-3 h-4 w-20 rounded bg-muted animate-pulse" />
        ))}
      </div>
    </PageContainer>
  )
}
