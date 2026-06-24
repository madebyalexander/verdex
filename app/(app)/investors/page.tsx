import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { InvestorsView } from '@/components/investors/InvestorsView'
import { ConsensusSection } from '@/components/investors/ConsensusSection'
import { IoPeople as Community } from 'react-icons/io5'

export default function InvestorsPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Community}
        title="Top investors"
        description="What famous funds are buying & selling, from their latest SEC 13F filings"
      />
      <CardStack>
        <InvestorsView />
        <ConsensusSection />
        <p className="text-xs text-muted-foreground">
          13F filings are reported quarterly and published up to 45 days after
          quarter-end, so holdings reflect the last reported period — not
          real-time positions. Buy/sell changes are derived by comparing the two
          most recent filings. Source: SEC EDGAR. Investor portraits via
          Wikimedia Commons.
        </p>
      </CardStack>
    </PageContainer>
  )
}
