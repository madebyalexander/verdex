import { createClient, getCurrentUser } from '@/lib/supabase/server'
import { mergeWithDefaults } from '@/lib/preferences'
import { OnboardingFlow } from './OnboardingFlow'

/**
 * Shows the first-run onboarding once — only after the legal disclaimer has
 * been acknowledged, and only until the user completes or skips it.
 */
export async function OnboardingGate() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('disclaimer_acked_at, preferences')
    .eq('id', user.id)
    .single()

  if (!data?.disclaimer_acked_at) return null
  if (mergeWithDefaults(data.preferences).onboarded) return null

  return <OnboardingFlow />
}
