'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function GoogleButton() {
  const supabase = createClient()

  async function handleClick() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) console.error('Google OAuth start failed:', error.message)
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleClick}>
      Continue with Google
    </Button>
  )
}
