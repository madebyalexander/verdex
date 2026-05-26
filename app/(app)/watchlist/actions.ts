'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  findUserWatchlist,
  getOrCreateWatchlist,
} from '@/lib/watchlist'

const SymbolSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Symbol must be 1–10 uppercase chars')

export async function addToWatchlist(
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
  if (!user) return { error: 'Not authenticated' }

  let watchlistId: string
  try {
    watchlistId = await getOrCreateWatchlist()
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to create watchlist',
    }
  }

  const { error } = await supabase
    .from('watchlist_items')
    .insert({ watchlist_id: watchlistId, symbol: sym })

  // Schema has UNIQUE(watchlist_id, symbol) — treat duplicate as success
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    return { error: error.message }
  }

  revalidatePath(`/stocks/${sym}`)
  revalidatePath('/watchlist')
  return {}
}

export async function removeFromWatchlist(
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
  if (!user) return { error: 'Not authenticated' }

  const watchlistId = await findUserWatchlist()
  if (!watchlistId) return {} // nothing to remove

  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('watchlist_id', watchlistId)
    .eq('symbol', sym)

  if (error) return { error: error.message }

  revalidatePath(`/stocks/${sym}`)
  revalidatePath('/watchlist')
  return {}
}

// ---------------------------------------------------------------------
// Watchlist management (Phase 3 #14)
// ---------------------------------------------------------------------

const NameSchema = z
  .string()
  .trim()
  .min(1, 'Name required')
  .max(40, 'Name max 40 chars')

export async function createWatchlistAction(
  name: string
): Promise<{ error?: string; id?: string }> {
  const parsed = NameSchema.safeParse(name)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid name' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: user.id, name: parsed.data })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/watchlist')
  return { id: data.id }
}

export async function renameWatchlistAction(
  id: string,
  name: string
): Promise<{ error?: string }> {
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) return { error: 'Invalid watchlist ID' }
  const nameParsed = NameSchema.safeParse(name)
  if (!nameParsed.success) {
    return { error: nameParsed.error.issues[0]?.message ?? 'Invalid name' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('watchlists')
    .update({ name: nameParsed.data })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/watchlist')
  return {}
}

export async function deleteWatchlistAction(
  id: string
): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'Invalid watchlist ID' }

  const supabase = await createClient()

  // Guard: don't let the user delete their LAST watchlist.
  // (Schema permits zero — but the detail-page toggle relies on a default.)
  const { count } = await supabase
    .from('watchlists')
    .select('*', { count: 'exact', head: true })
  if ((count ?? 0) <= 1) {
    return { error: 'Cannot delete your last watchlist' }
  }

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/watchlist')
  return {}
}
