import { NewsSkeleton } from '@/components/news/NewsSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { IoDocumentText as JournalPage } from 'react-icons/io5'

export default function NewsLoading() {
  return (
    <PageContainer>
      <PageHeader
        icon={JournalPage}
        title="Market news"
        description="Last 7 days across your watchlist + popular tickers"
      />
      <CardStack>
        <NewsSkeleton />
      </CardStack>
    </PageContainer>
  )
}
