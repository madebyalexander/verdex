import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses Row-Level Security.
// Server-only. Use for cron pre-warming, webhook handlers, admin ops.
// NEVER import from a client component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
