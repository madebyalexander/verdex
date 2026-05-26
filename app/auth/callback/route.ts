import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles OAuth and magic-link callbacks. Supabase redirects here with `?code=...`
// after the provider (Google, email link) authorizes the user.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[/auth/callback] exchange failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
