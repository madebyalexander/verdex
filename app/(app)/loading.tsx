import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function AppLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2" aria-hidden>
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
      </div>
      <Skeleton className="h-72 rounded-[20px]" aria-hidden />
    </PageContainer>
  )
}
