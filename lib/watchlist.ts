import { createClient } from '@/lib/supabase/server'

// Returns the user's watchlist ID, or null if they don't have one yet.
// Side-effect-free — safe to call from check/list paths without creating
// empty watchlists for every new user that loads a stock page.
export async function findUserWatchlist(): Promise<string | null> {
  const supabase = await createClient()
  // RLS scopes this to the current user's rows.
  const { data } = await supabase
    .from('watchlists')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

// Get-or-create the user's default watchlist. Only call from write paths
// (e.g. addToWatchlist) so first-time users don't accumulate empty rows.
export async function getOrCreateWatchlist(): Promise<string> {
  const existing = await findUserWatchlist()
  if (existing) return existing

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: created, error } = await supabase
    .from('watchlists')
    .insert({ user_id: user.id })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export async function checkInWatchlist(symbol: string): Promise<boolean> {
  const watchlistId = await findUserWatchlist()
  if (!watchlistId) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('watchlist_items')
    .select('id')
    .eq('watchlist_id', watchlistId)
    .eq('symbol', symbol)
    .maybeSingle()
  return !!data
}

export type WatchlistItem = {
  symbol: string
  notes: string | null
  added_at: string
}

export type WatchlistMeta = {
  id: string
  name: string
  item_count: number
}

export async function listWatchlistItems(
  watchlistId?: string
): Promise<WatchlistItem[]> {
  // Resolve to the user's first watchlist when no id is given.
  const id = watchlistId ?? (await findUserWatchlist())
  if (!id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('watchlist_items')
    .select('symbol, notes, added_at')
    .eq('watchlist_id', id)
    .order('added_at', { ascending: false })
  return data ?? []
}

export async function listAllWatchlists(): Promise<WatchlistMeta[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('watchlists')
    .select('id, name')
    .order('created_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  // Count items per watchlist in parallel
  return await Promise.all(
    rows.map(async (r) => {
      const { count } = await supabase
        .from('watchlist_items')
        .select('*', { count: 'exact', head: true })
        .eq('watchlist_id', r.id)
      return { id: r.id, name: r.name, item_count: count ?? 0 }
    })
  )
}

export async function getWatchlistById(
  id: string
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('watchlists')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()
  return data
}
