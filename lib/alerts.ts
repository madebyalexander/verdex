import { createClient } from '@/lib/supabase/server'

export type Alert = {
  id: string
  symbol: string
  condition: 'above' | 'below'
  target_price: number
  active: boolean
  triggered_at: string | null
  created_at: string
}

export async function listUserAlerts(): Promise<Alert[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('price_alerts')
    .select('id, symbol, condition, target_price, active, triggered_at, created_at')
    .order('created_at', { ascending: false })
  return (data as Alert[] | null) ?? []
}

export async function getActiveAlertsForSymbol(symbol: string): Promise<Alert[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('price_alerts')
    .select('id, symbol, condition, target_price, active, triggered_at, created_at')
    .eq('symbol', symbol)
    .eq('active', true)
    .is('triggered_at', null)
  return (data as Alert[] | null) ?? []
}

/**
 * Lazy alert evaluation — runs when the user visits a stock's detail page.
 * Any active (untriggered) alert whose threshold the current price has crossed
 * gets marked `triggered_at = now()` and returned for banner display.
 *
 * No background polling required. Trade-off: alerts only fire when someone
 * visits the symbol page. Acceptable for MVP; cron polling can replace this.
 */
export async function checkAndTriggerAlerts(
  symbol: string,
  currentPrice: number
): Promise<Alert[]> {
  const active = await getActiveAlertsForSymbol(symbol)
  const crossed = active.filter((a) =>
    a.condition === 'above'
      ? currentPrice >= Number(a.target_price)
      : currentPrice <= Number(a.target_price)
  )
  if (crossed.length === 0) return []

  const supabase = await createClient()
  const triggeredAt = new Date().toISOString()
  await supabase
    .from('price_alerts')
    .update({ triggered_at: triggeredAt })
    .in(
      'id',
      crossed.map((a) => a.id)
    )

  return crossed.map((a) => ({ ...a, triggered_at: triggeredAt }))
}
