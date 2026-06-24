/**
 * Curated starter tickers per sector, used by the onboarding watchlist step.
 * Keys match SECTOR_OPTIONS in lib/preferences.ts. Client-safe (no server deps).
 */
export const SECTOR_TICKERS: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'NVDA', 'AVGO'],
  Healthcare: ['UNH', 'LLY', 'JNJ', 'PFE'],
  'Financial Services': ['JPM', 'BAC', 'V', 'MA'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE'],
  'Consumer Defensive': ['WMT', 'KO', 'PG', 'COST'],
  Energy: ['XOM', 'CVX', 'COP'],
  Industrials: ['CAT', 'BA', 'GE', 'UPS'],
  'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS'],
  'Real Estate': ['PLD', 'AMT', 'SPG'],
  Utilities: ['NEE', 'DUK', 'SO'],
  'Basic Materials': ['LIN', 'SHW', 'FCX'],
}

/** Fallback popular tickers when no sector is selected. */
export const DEFAULT_SUGGESTIONS = [
  'AAPL',
  'NVDA',
  'MSFT',
  'AMZN',
  'GOOGL',
  'TSLA',
  'META',
  'JPM',
]

/** Suggested tickers given the user's chosen sectors (deduped, capped). */
export function suggestTickers(sectors: string[], limit = 12): string[] {
  if (sectors.length === 0) return DEFAULT_SUGGESTIONS.slice(0, limit)
  const out: string[] = []
  for (const s of sectors) {
    for (const t of SECTOR_TICKERS[s] ?? []) {
      if (!out.includes(t)) out.push(t)
    }
  }
  if (out.length === 0) return DEFAULT_SUGGESTIONS.slice(0, limit)
  return out.slice(0, limit)
}
