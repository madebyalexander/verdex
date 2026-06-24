import { WatchlistSkeleton } from '@/components/watchlist/WatchlistSkeleton'
import { AlertsSkeleton } from '@/components/alerts/AlertsSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { CardStack } from '@/components/layout/CardStack'
import { IoStar as Star } from 'react-icons/io5'

export default function WatchlistLoading() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        icon={Star}
        title="Watchlist"
        description="Your tracked stocks and price alerts"
      />
      <CardStack>
        <div className="flex flex-wrap gap-1.5">
          <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-28 rounded-full bg-muted animate-pulse" />
        </div>
        <WatchlistSkeleton />
        <SectionHeader
          title="Price alerts"
          description="Fire when the price crosses your threshold and you visit the symbol"
        />
        <AlertsSkeleton />
      </CardStack>
    </PageContainer>
  )
}
