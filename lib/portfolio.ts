import { createClient } from '@/lib/supabase/server'

export type Position = {
  id: string
  symbol: string
  quantity: number
  cost_basis: number
  opened_at: string
  created_at: string
}

// Mirror of the watchlist pattern: side-effect-free lookup vs.
// get-or-create. Don't create empty portfolios on read paths.
export async function findUserPortfolio(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolios')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function getOrCreatePortfolio(): Promise<string> {
  const existing = await findUserPortfolio()
  if (existing) return existing

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('portfolios')
    .insert({ user_id: user.id })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function listPositions(): Promise<Position[]> {
  const portfolioId = await findUserPortfolio()
  if (!portfolioId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolio_positions')
    .select('id, symbol, quantity, cost_basis, opened_at, created_at')
    .eq('portfolio_id', portfolioId)
    .order('opened_at', { ascending: false })
  return (data as Position[] | null) ?? []
}
