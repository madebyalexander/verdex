import 'server-only'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import {
  DEFAULT_PREFERENCES,
  mergeWithDefaults,
  type Preferences,
} from '@/lib/preferences'

/**
 * Read the current user's preferences. Returns DEFAULT_PREFERENCES if no
 * profile row exists (shouldn't normally happen — handle_new_user trigger
 * creates one — but defensive in case).
 */
export async function readPreferences(): Promise<Preferences> {
  const user = await getCurrentUser()
  if (!user) return DEFAULT_PREFERENCES
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  return mergeWithDefaults(data?.preferences)
}

/**
 * Partially update the current user's preferences. Unspecified keys are
 * preserved. Returns the updated, normalized shape.
 */
export async function writePreferences(
  patch: Partial<Preferences>
): Promise<{ ok: true; prefs: Preferences } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const current = await readPreferences()
  const next = mergeWithDefaults({ ...current, ...patch })

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: next, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true, prefs: next }
}
