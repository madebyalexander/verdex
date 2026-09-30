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
  MarketPulse,
  MarketPulseSkeleton,
} from '@/components/dashboard/MarketPulse'
import { Greeting, TodayLabel } from '@/components/dashboard/Greeting'
import {
  InvestorMoves,
  InvestorMovesSkeleton,
} from '@/components/dashboard/InvestorMoves'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { buttonVariants } from '@/components/ui/button'
import {
  IoChevronForward as NavArrowRight,
  IoGitCompare as Compare,
} from 'react-icons/io5'

function ViewAll({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {label}
      <NavArrowRight aria-hidden className="size-3.5" />
    </Link>
  )
}

export default async function DashboardPage() {
  const [prefs, profile] = await Promise.all([readPreferences(), readProfile()])
  // Open Market overview on the user's preferred sector when they have one.
  const initialSector = prefs.preferred_sectors.find((s) =>
    MARKET_SECTORS.includes(s)
  )

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<TodayLabel />}
        title={<Greeting name={profile?.display_name?.trim() || null} />}
        description="Here's what's moving in the markets and the stocks you follow."
        action={
          <Link
            href="/compare"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            <Compare aria-hidden />
            Compare stocks
          </Link>
        }
      />

      <section aria-label="Market pulse">
        <Suspense fallback={<MarketPulseSkeleton />}>
          <MarketPulse />
        </Suspense>
      </section>

      <Suspense fallback={<AIInsightsSkeleton />}>
        <AIInsights />
      </Suspense>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Market overview"
          description="Your watchlist and the largest names in each sector"
          action={<ViewAll href="/market" />}
        />
        <MarketOverview initialSector={initialSector} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Smart money"
          description="What famous funds are buying, from SEC 13F filings"
          action={<ViewAll href="/investors" label="All investors" />}
        />
        <Suspense fallback={<InvestorMovesSkeleton />}>
          <InvestorMoves />
        </Suspense>
      </section>

      <DisclaimerModal openByDefault={!profile?.disclaimer_acked_at} />
    </PageContainer>
  )
}

async function readProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, disclaimer_acked_at')
    .eq('id', user.id)
    .single()
  return data as {
    display_name: string | null
    disclaimer_acked_at: string | null
  } | null
}
