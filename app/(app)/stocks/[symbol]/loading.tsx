import { StockHeroSkeleton } from '@/components/stock/StockHeroSkeleton'
import { PriceChartSkeleton } from '@/components/stock/PriceChartSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CardStack } from '@/components/layout/CardStack'

export default function StockLoading() {
  return (
    <PageContainer>
      <StockHeroSkeleton />
      <CardStack>
        <PriceChartSkeleton />
        <div className="inline-flex items-center gap-1 h-8 px-[3px] rounded-2xl bg-muted self-start">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[26px] w-20 rounded-xl bg-foreground/5 animate-pulse"
            />
          ))}
        </div>
      </CardStack>
    </PageContainer>
  )
}
