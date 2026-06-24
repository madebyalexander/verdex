/**
 * Curated stock universe for the dashboard Market Overview, grouped by sector.
 * Kept to ~5 liquid large-caps per sector so a single sector view stays cheap
 * to fetch (the Alpha Vantage sparkline is the rate-limited bottleneck).
 *
 * Sector keys align with SECTOR_OPTIONS in lib/preferences.ts so a user's
 * preferred sectors can drive the default view later.
 */
export const MARKET_UNIVERSE: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL'],
  'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS', 'TMUS'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
  'Consumer Defensive': ['WMT', 'PG', 'KO', 'PEP', 'COST'],
  'Financial Services': ['JPM', 'V', 'MA', 'BAC', 'GS'],
  Healthcare: ['LLY', 'UNH', 'JNJ', 'ABBV', 'MRK'],
  Energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  Industrials: ['CAT', 'BA', 'GE', 'HON', 'UPS'],
}

export const MARKET_SECTORS = Object.keys(MARKET_UNIVERSE)

/** Special pseudo-sector that resolves to the signed-in user's watchlist. */
export const WATCHLIST_KEY = 'Watchlist'

export const DEFAULT_MARKET_SECTOR = WATCHLIST_KEY

export type MarketStock = {
  symbol: string
  name: string
  price: number | null
  changePct: number | null
  /** Market cap in USD (already expanded from Finnhub's millions). */
  marketCap: number | null
  pe: number | null
  week52High: number | null
  week52Low: number | null
  /** Last ~30 daily closes for the sparkline. Empty if unavailable. */
  closes: number[]
}

/**
 * Broader universe for the paginated, infinite-scroll Markets page. Each page
 * is enriched with Finnhub quote + profile only (NO Alpha Vantage sparkline),
 * so the list scales across the whole set within free-tier limits.
 */
export const MARKET_FEED_SYMBOLS: string[] = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'ORCL', 'NFLX',
  'AMD', 'ADBE', 'CRM', 'CSCO', 'INTC', 'QCOM', 'TXN', 'IBM', 'NOW', 'INTU',
  'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'AXP', 'C', 'SCHW',
  'BRK.B', 'BLK', 'SPGI', 'COF', 'PYPL',
  'LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'CVS', 'MDT',
  'WMT', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW',
  'HD', 'DIS', 'CMCSA', 'TMUS', 'VZ', 'T',
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'MPC',
  'CAT', 'BA', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'UNP', 'MMM',
  'LIN', 'SHW', 'FCX', 'NEM',
  'PLD', 'AMT', 'SPG', 'O',
  'NEE', 'DUK', 'SO', 'D',
  'UBER', 'ABNB', 'SHOP', 'SNOW', 'PLTR', 'COIN',
]
