import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseEnv, supabaseServiceRoleKey } from '@/lib/supabase/env'

// Service-role client — bypasses Row-Level Security.
// Server-only. Use for cron pre-warming, webhook handlers, admin ops.
// NEVER import from a client component.
//
// Lazily constructed on first use (via a Proxy) so importing this module does
// NOT require env vars to be present — otherwise `next build` throws while
// collecting page data on environments without secrets (e.g. preview/CI).
let client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseEnv().url, supabaseServiceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver)
    return typeof value === 'function' ? value.bind(getClient()) : value
  },
})
