/**
 * Plain-language definitions for the jargon surfaced across the app, shown via
 * <InfoTip term="…" />. Keep each definition to a sentence or two, neutral and
 * non-advisory.
 */
export type GlossaryEntry = { title: string; definition: string }

export const GLOSSARY = {
  // Technical indicators
  rsi: {
    title: 'RSI (14)',
    definition:
      'Relative Strength Index over 14 days, on a 0–100 scale. Above 70 is often called overbought, below 30 oversold.',
  },
  macd: {
    title: 'MACD',
    definition:
      'Moving Average Convergence Divergence — momentum measured from the gap between a 12- and 26-day average. Crossing its signal line flags bullish or bearish shifts.',
  },
  atr: {
    title: 'ATR (14)',
    definition:
      'Average True Range — the typical size of a daily price move over 14 days. A volatility gauge, shown in dollars.',
  },
  rangePosition: {
    title: 'Range position',
    definition:
      "Where the current price sits within the analyzed period's high–low range. 0% is the period low, 100% the period high.",
  },
  movingAverage: {
    title: 'Moving averages (SMA)',
    definition:
      'A Simple Moving Average is the average close over N days. Price above the line is generally read as bullish, below as bearish. A 50-day crossing above the 200-day is a "golden cross" (bullish); below is a "death cross" (bearish).',
  },
  bollinger: {
    title: 'Bollinger bands (20, 2σ)',
    definition:
      'A 20-day average with bands set 2 standard deviations above and below it. Price near a band suggests it is stretched; near the middle is typical.',
  },

  // Key stats
  pe: {
    title: 'P/E ratio',
    definition:
      'Price-to-Earnings — share price divided by earnings per share. Roughly, the dollars paid per $1 of annual profit.',
  },
  marketCap: {
    title: 'Market cap',
    definition:
      'The company’s total market value — share price times shares outstanding.',
  },
  prevClose: {
    title: 'Previous close',
    definition: 'The price at the end of the prior trading session.',
  },
  dayRange: {
    title: 'Day range',
    definition:
      "Today's lowest and highest traded prices; the marker shows where the current price falls between them.",
  },
  week52Range: {
    title: '52-week range',
    definition:
      'The lowest and highest price over the past year; the marker shows where the current price falls within it.',
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryKey = keyof typeof GLOSSARY
