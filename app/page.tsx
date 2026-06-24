import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { readPreferences } from '@/lib/preferences.server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const prefs = await readPreferences()
  redirect(`/${prefs.default_landing}`)
}
