import { WatchlistSkeleton } from '@/components/watchlist/WatchlistSkeleton'
import { AlertsSkeleton } from '@/components/alerts/AlertsSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { IoStar as Star } from 'react-icons/io5'

export default function WatchlistLoading() {
  return (
    <PageContainer>
      <PageHeader
        icon={Star}
        title="Watchlist"
        description="The stocks you follow and the price alerts you've set"
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start lg:gap-6">
        <div className="min-w-0 lg:col-span-2">
          <WatchlistSkeleton />
        </div>
        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Price alerts"
            description="Checked when you open the stock — fires once the price crosses your target"
          />
          <AlertsSkeleton />
        </section>
      </div>
    </PageContainer>
  )
}
