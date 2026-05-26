import { supabaseAdmin } from '@/lib/supabase/admin'
import type { ForecastOutput } from '@/lib/zod-schemas'

export type Insight = {
  symbol: string
  prediction: ForecastOutput
  model: string
  generated_at: string
  expires_at: string
}

// Most-recently-generated forecasts, deduped per symbol.
// Uses service role (supabaseAdmin) since ai_predictions has RLS enabled
// with no policies — it's a server-only cache.
export async function getRecentInsights(limit = 6): Promise<Insight[]> {
  const { data } = await supabaseAdmin
    .from('ai_predictions')
    .select('symbol, prediction, model, generated_at, expires_at')
    .order('generated_at', { ascending: false })
    .limit(limit * 4) // overfetch to dedupe by symbol below

  if (!data) return []

  const seen = new Set<string>()
  const insights: Insight[] = []
  for (const row of data as Insight[]) {
    if (seen.has(row.symbol)) continue
    seen.add(row.symbol)
    insights.push(row)
    if (insights.length >= limit) break
  }
  return insights
}
