'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function GoogleButton() {
  const supabase = createClient()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      console.error('Google OAuth start failed:', error.message)
      toast.error('Google sign-in is unavailable', {
        description: error.message,
      })
      setPending(false)
    }
    // On success the browser redirects to Google, so no need to reset `pending`.
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={pending}
    >
      Continue with Google
    </Button>
  )
}
