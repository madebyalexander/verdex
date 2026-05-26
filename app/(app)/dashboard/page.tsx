import { Suspense } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { SymbolBadge } from '@/components/ui/symbol-badge'
import { createClient } from '@/lib/supabase/server'
import { DisclaimerModal } from '@/components/disclaimer/DisclaimerModal'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { MarketOverviewSkeleton } from '@/components/dashboard/MarketOverviewSkeleton'
import { WatchlistSummary } from '@/components/dashboard/WatchlistSummary'
import { WatchlistSummarySkeleton } from '@/components/dashboard/WatchlistSummarySkeleton'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'

const POPULAR = [
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'TSLA',
  'META',
  'AMZN',
  'NFLX',
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, disclaimer_acked_at')
    .eq('id', user!.id)
    .single()

  const needsDisclaimer = !profile?.disclaimer_acked_at

  return (
    <main className="p-6 max-w-6xl mx-auto flex flex-col gap-8">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome${profile?.display_name ? `, ${profile.display_name}` : ''}`}
        description="Your snapshot of the markets and the stocks you're tracking."
      />

      <section className="flex flex-col gap-3">
        <SectionHeader title="Market overview" />
        <Suspense fallback={<MarketOverviewSkeleton />}>
          <MarketOverview />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your watchlist" />
        <Suspense fallback={<WatchlistSummarySkeleton />}>
          <WatchlistSummary />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Recent AI insights" />
        <Suspense fallback={null}>
          <AIInsights />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Browse popular" />
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((symbol) => (
            <SymbolBadge
              key={symbol}
              symbol={symbol}
              href={`/stocks/${symbol}`}
            />
          ))}
        </div>
      </section>

      <DisclaimerModal openByDefault={needsDisclaimer} />
    </main>
  )
}
