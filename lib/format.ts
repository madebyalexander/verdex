// Centralized formatting helpers. Use these instead of inline
// Intl.NumberFormat instances — keeps locale + decimals consistent across
// every price/percent/market-cap display in the app.

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const usdCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

/** $1,234.56 */
export const usd = (v: number): string => usdFormatter.format(v)

/** $4.5T / $329B / $12.4M */
export const compactUsd = (v: number): string => usdCompactFormatter.format(v)

/** 14.69B / 320.5M */
export const compactNum = (v: number): string => compactFormatter.format(v)

/** +1.23% / -0.45% — always signed, fixed 2 decimals */
export const pct = (v: number): string =>
  `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
