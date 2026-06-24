'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateWatchlist } from '@/lib/watchlist'
import { writePreferences } from '@/lib/preferences.server'
import {
  SECTOR_OPTIONS,
  type ExperienceLevel,
} from '@/lib/preferences'

const Schema = z.object({
  experience_level: z.enum(['new', 'some']),
  sectors: z.array(z.string()).max(11),
  symbols: z.array(z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/)).max(20),
})

export async function completeOnboarding(input: {
  experience_level: ExperienceLevel
  sectors: string[]
  symbols: string[]
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = Schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const sectors = parsed.data.sectors.filter((s) =>
    (SECTOR_OPTIONS as readonly string[]).includes(s)
  )
  const symbols = Array.from(
    new Set(parsed.data.symbols.map((s) => s.toUpperCase()))
  )

  const res = await writePreferences({
    experience_level: parsed.data.experience_level,
    preferred_sectors: sectors,
    onboarded: true,
  })
  if (!res.ok) return { ok: false, error: res.error }

  if (symbols.length > 0) {
    try {
      const watchlistId = await getOrCreateWatchlist()
      const supabase = await createClient()
      // UNIQUE(watchlist_id, symbol) — ignore duplicates on conflict.
      const { error } = await supabase
        .from('watchlist_items')
        .upsert(
          symbols.map((symbol) => ({ watchlist_id: watchlistId, symbol })),
          { onConflict: 'watchlist_id,symbol', ignoreDuplicates: true }
        )
      if (error) console.error('[completeOnboarding] seed watchlist:', error.message)
    } catch (err) {
      console.error('[completeOnboarding] watchlist:', err)
    }
  }

  revalidatePath('/watchlist')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function skipOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const res = await writePreferences({ onboarded: true })
  return res.ok ? { ok: true } : { ok: false, error: res.error }
}
