/**
 * Broker dropdown for the "Buy" CTA on stock detail pages.
 *
 * Each broker has a single `url` you paste from the broker's affiliate
 * dashboard (or just their public deep-link if you haven't joined their
 * program yet). If the URL contains the literal `{SYMBOL}` placeholder
 * it's replaced with the current ticker at click time — so deep-link
 * affiliate URLs that include a symbol path work without extra wiring.
 *
 * `referralOnly: true` is a hint for the UI: signup-landing links can't
 * preserve the ticker context, so we render a "Referral" badge and a
 * "lands on signup, not symbol page" copy.
 *
 * Verdex does NOT execute trades or hold custody. The disclaimer
 * under the dropdown makes that explicit.
 */
export type Broker = {
  id: string
  name: string
  /** One-line context shown in the dropdown. */
  description: string
  /** Region tag (US, EU, Global). Ignored when referralOnly = true. */
  region: 'US' | 'EU' | 'Global'
  /** Affiliate or deep-link URL. Use `{SYMBOL}` to interpolate the ticker. */
  url: string
  /** Signup-landing — broker controls the destination, symbol is ignored. */
  referralOnly?: boolean
}

export const BROKERS: readonly Broker[] = [
  // eToro — live referral.
  {
    id: 'etoro',
    name: 'eToro',
    description: 'Sign up with our referral bonus',
    region: 'Global',
    url: 'https://etoro.tw/49kwwXi',
    referralOnly: true,
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Commission-free trading',
    region: 'US',
    url: 'https://robinhood.com/stocks/{SYMBOL}',
  },
  {
    id: 'webull',
    name: 'Webull',
    description: 'Commission-free · extended hours',
    region: 'US',
    url: 'https://app.webull.com/quote/{SYMBOL_LOWER}',
  },
  {
    id: 'public',
    name: 'Public.com',
    description: 'Fractional shares · social investing',
    region: 'US',
    url: 'https://public.com/stocks/{SYMBOL}',
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    description: 'Charts + broker integrations',
    region: 'Global',
    url: 'https://www.tradingview.com/symbols/{SYMBOL}/',
  },
] as const

/**
 * Substitutes `{SYMBOL}` and `{SYMBOL_LOWER}` in a broker URL with the
 * current ticker. Plain URLs (no placeholders) pass through unchanged.
 */
export function brokerUrlFor(broker: Broker, symbol: string): string {
  return broker.url
    .replaceAll('{SYMBOL}', encodeURIComponent(symbol))
    .replaceAll('{SYMBOL_LOWER}', encodeURIComponent(symbol.toLowerCase()))
}
