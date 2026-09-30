import { PortfolioSkeleton } from '@/components/portfolio/PortfolioSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { IoPieChart as PortfolioIcon } from 'react-icons/io5'

export default function PortfolioLoading() {
  return (
    <PageContainer>
      <PageHeader
        icon={PortfolioIcon}
        title="Portfolio"
        description="Live value and profit & loss across the positions you track."
      />
      <PortfolioSkeleton />
    </PageContainer>
  )
}
