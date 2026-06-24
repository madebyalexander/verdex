import { MarketBrowser } from '@/components/market/MarketBrowser'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { IoStatsChart as Markets } from 'react-icons/io5'

export default function MarketPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Markets}
        title="Markets"
        description="Browse stocks by sector or scroll the full market"
      />
      <MarketBrowser />
    </PageContainer>
  )
}
