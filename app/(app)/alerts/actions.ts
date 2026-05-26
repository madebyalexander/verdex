'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateAlertSchema = z.object({
  symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/, 'Invalid symbol'),
  condition: z.enum(['above', 'below']),
  target_price: z.number().positive('Target price must be positive'),
})

export async function createAlert(input: {
  symbol: string
  condition: 'above' | 'below'
  target_price: number
}): Promise<{ error?: string }> {
  const parsed = CreateAlertSchema.safeParse({
    symbol: input.symbol.trim().toUpperCase(),
    condition: input.condition,
    target_price: input.target_price,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('price_alerts').insert({
    user_id: user.id,
    symbol: parsed.data.symbol,
    condition: parsed.data.condition,
    target_price: parsed.data.target_price,
  })
  if (error) return { error: error.message }

  revalidatePath(`/stocks/${parsed.data.symbol}`)
  revalidatePath('/alerts')
  return {}
}

export async function deleteAlert(id: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'Invalid alert ID' }

  const supabase = await createClient()
  const { error } = await supabase.from('price_alerts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/alerts')
  return {}
}
