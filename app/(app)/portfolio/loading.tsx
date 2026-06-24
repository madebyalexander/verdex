import { PortfolioSkeleton } from '@/components/portfolio/PortfolioSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { IoBriefcase as Suitcase } from 'react-icons/io5'

export default function PortfolioLoading() {
  return (
    <PageContainer>
      <PageHeader icon={Suitcase} title="Portfolio" />
      <CardStack>
        <PortfolioSkeleton />
      </CardStack>
    </PageContainer>
  )
}
