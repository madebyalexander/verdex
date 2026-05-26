'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { aiRefreshRatelimit } from '@/lib/ratelimit'
import { generateFreshForecast } from '@/lib/forecast'
import { UnknownSymbolError } from '@/lib/apis/finnhub'

const SymbolSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Invalid symbol')

export async function refreshForecast(
  symbol: string
): Promise<{ error?: string }> {
  const sym = symbol.trim().toUpperCase()
  const parsed = SymbolSchema.safeParse(sym)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid symbol' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to refresh forecasts.' }

  const { success } = await aiRefreshRatelimit.limit(user.id)
  if (!success) {
    return { error: 'Refresh limit reached (10/hour). Try again later.' }
  }

  try {
    await generateFreshForecast(sym)
  } catch (err) {
    if (err instanceof UnknownSymbolError) {
      return { error: 'Symbol not found.' }
    }
    console.error('[refreshForecast]', err)
    return { error: 'Forecast generation failed. Try again shortly.' }
  }

  revalidatePath(`/stocks/${sym}`)
  return {}
}
