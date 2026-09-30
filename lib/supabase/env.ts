import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js'

const SETUP_HINT =
  'Copy .env.example to .env.local, fill in the values from Supabase → Project Settings → API, then restart `npm run dev`.'

/**
 * Supabase URL + anon key, validated so a missing or placeholder value fails
 * with an actionable message instead of the SDK's generic one.
 * NEXT_PUBLIC_* are referenced literally so Next.js inlines them client-side.
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ].filter(Boolean)
    throw new Error(
      `Supabase is not configured: ${missing.join(' and ')} missing from .env.local. ${SETUP_HINT}`
    )
  }
  if (url.includes('your-project.supabase.co')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is still the placeholder from .env.example. ${SETUP_HINT}`
    )
  }
  return { url, anonKey }
}

export function supabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      `Supabase is not configured: SUPABASE_SERVICE_ROLE_KEY missing from .env.local. ${SETUP_HINT}`
    )
  }
  return key
}

export const SUPABASE_UNREACHABLE =
  "Can't reach Supabase right now. If your project is on the free plan it may have been paused for inactivity — restore it from the Supabase dashboard, then try again."

/** Network failure or Supabase-side outage (incl. a paused project), as opposed to a user error. */
export function isSupabaseUnreachable(error: AuthError): boolean {
  return (
    isAuthRetryableFetchError(error) ||
    (typeof error.status === 'number' && error.status >= 500)
  )
}
