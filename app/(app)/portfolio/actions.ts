'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getOrCreatePortfolio } from '@/lib/portfolio'

const AddPositionSchema = z.object({
  symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Invalid symbol'),
  quantity: z.number().positive('Quantity must be positive'),
  cost_basis: z.number().min(0, 'Cost basis must be ≥ 0'),
  opened_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export async function addPosition(input: {
  symbol: string
  quantity: number
  cost_basis: number
  opened_at: string
}): Promise<{ error?: string }> {
  const parsed = AddPositionSchema.safeParse({
    symbol: input.symbol.trim().toUpperCase(),
    quantity: input.quantity,
    cost_basis: input.cost_basis,
    opened_at: input.opened_at,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  let portfolioId: string
  try {
    portfolioId = await getOrCreatePortfolio()
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to create portfolio',
    }
  }

  const { error } = await supabase.from('portfolio_positions').insert({
    portfolio_id: portfolioId,
    symbol: parsed.data.symbol,
    quantity: parsed.data.quantity,
    cost_basis: parsed.data.cost_basis,
    opened_at: parsed.data.opened_at,
  })

  if (error) return { error: error.message }

  revalidatePath('/portfolio')
  return {}
}

export async function deletePosition(id: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'Invalid position ID' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('portfolio_positions')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/portfolio')
  return {}
}
