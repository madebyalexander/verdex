import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import { readPreferences } from '@/lib/preferences.server'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { DisplaySection } from '@/components/settings/DisplaySection'
import { InterestsSection } from '@/components/settings/InterestsSection'
import { ExperienceSection } from '@/components/settings/ExperienceSection'
import { AISection } from '@/components/settings/AISection'
import { PrivacySection } from '@/components/settings/PrivacySection'
import { IoSettings as SettingsIcon } from 'react-icons/io5'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const [{ data: profile }, prefs] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, disclaimer_acked_at')
      .eq('id', user.id)
      .single(),
    readPreferences(),
  ])

  return (
    <PageContainer width="narrow">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Profile, preferences, and AI behavior"
      />

      <CardStack>
        <ProfileSection
          email={user.email ?? ''}
          displayName={profile?.display_name ?? ''}
        />

        <DisplaySection
          defaultLanding={prefs.default_landing}
          defaultForecastHorizon={prefs.default_forecast_horizon}
        />

        <ExperienceSection experienceLevel={prefs.experience_level} />

        <InterestsSection preferredSectors={prefs.preferred_sectors} />

        <AISection riskProfile={prefs.risk_profile} />

        <PrivacySection
          disclaimerAckedAt={profile?.disclaimer_acked_at ?? null}
        />
      </CardStack>
    </PageContainer>
  )
}
