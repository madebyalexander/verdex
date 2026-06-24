import { Suspense } from 'react'
import Link from 'next/link'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import { readPreferences } from '@/lib/preferences.server'
import { MARKET_SECTORS } from '@/lib/market-universe'
import { DisclaimerModal } from '@/components/disclaimer/DisclaimerModal'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { AIInsightsSkeleton } from '@/components/dashboard/AIInsightsSkeleton'
import {
  InvestorMoves,
  InvestorMovesSkeleton,
} from '@/components/dashboard/InvestorMoves'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { IoGrid as Dashboard, IoChevronForward as NavArrowRight } from 'react-icons/io5'

export default async function DashboardPage() {
  const prefs = await readPreferences()
  // Open Market overview on the user's preferred sector when they have one.
  const initialSector = prefs.preferred_sectors.find((s) =>
    MARKET_SECTORS.includes(s)
  )

  return (
    <PageContainer>
      <PageHeader
        icon={Dashboard}
        title="Welcome"
        description="Your snapshot of the markets and the stocks you're tracking."
      />

      <CardStack>
        <Suspense fallback={<AIInsightsSkeleton />}>
          <AIInsights />
        </Suspense>

        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Market overview"
            description="Your watchlist & stocks by sector · tap any row for detail"
            action={
              <Link
                href="/market"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              >
                View all
                <NavArrowRight aria-hidden className="size-3.5" />
              </Link>
            }
          />
          <MarketOverview initialSector={initialSector} />
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Top investors"
            description="What famous funds are buying & selling · from SEC 13F filings"
            action={
              <Link
                href="/investors"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              >
                View all
                <NavArrowRight aria-hidden className="size-3.5" />
              </Link>
            }
          />
          <Suspense fallback={<InvestorMovesSkeleton />}>
            <InvestorMoves />
          </Suspense>
        </section>
      </CardStack>

      <Suspense fallback={null}>
        <DisclaimerGate />
      </Suspense>
    </PageContainer>
  )
}

async function DisclaimerGate() {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('disclaimer_acked_at')
    .eq('id', user.id)
    .single()
  return <DisclaimerModal openByDefault={!profile?.disclaimer_acked_at} />
}
