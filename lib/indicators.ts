import type { OhlcvBar } from '@/lib/apis/alpha-vantage'

// ---------------------------------------------------------------------
// Pure computation functions — no I/O, no external deps
// Each returns an array aligned to the input from the first valid point
// (so SMA(20) on 100 closes returns 81 values).
// ---------------------------------------------------------------------

export function sma(values: number[], period: number): number[] {
  if (period <= 0 || values.length < period) return []
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += values[i]
  out.push(sum / period)
  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period]
    out.push(sum / period)
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  if (period <= 0 || values.length < period) return []
  const out: number[] = []
  const k = 2 / (period + 1)
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out.push(prev)
  for (let i = period; i < values.length; i++) {
    prev = (values[i] - prev) * k + prev
    out.push(prev)
  }
  return out
}

export function rsi(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return []
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  const out: number[] = []
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  out.push(100 - 100 / (1 + avgGain / (avgLoss || 1e-9)))
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    out.push(100 - 100 / (1 + avgGain / (avgLoss || 1e-9)))
  }
  return out
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEma = ema(closes, fast)
  const slowEma = ema(closes, slow)
  if (slowEma.length === 0) return { macdLine: [], signalLine: [], histogram: [] }
  const offset = fastEma.length - slowEma.length
  const macdLine: number[] = []
  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i])
  }
  const signalLine = ema(macdLine, signalPeriod)
  const histogram: number[] = []
  const sigOffset = macdLine.length - signalLine.length
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + sigOffset] - signalLine[i])
  }
  return { macdLine, signalLine, histogram }
}

export function bollinger(
  closes: number[],
  period = 20,
  stdDevMult = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  if (closes.length < period) return { upper: [], middle: [], lower: [] }
  const middle = sma(closes, period)
  const upper: number[] = []
  const lower: number[] = []
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = middle[i - (period - 1)]
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    upper.push(mean + stdDevMult * std)
    lower.push(mean - stdDevMult * std)
  }
  return { upper, middle, lower }
}

export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number[] {
  if (highs.length < period + 1) return []
  const trs: number[] = []
  for (let i = 1; i < highs.length; i++) {
    trs.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    )
  }
  const out: number[] = []
  let v = trs.slice(0, period).reduce((a, b) => a + b, 0) / period
  out.push(v)
  for (let i = period; i < trs.length; i++) {
    v = (v * (period - 1) + trs[i]) / period
    out.push(v)
  }
  return out
}

// ---------------------------------------------------------------------
// summarizeIndicators — single-call helper that computes everything from
// an OHLC array and returns the latest values + state signals.
// Used by both the UI section and the forecast bundle.
// ---------------------------------------------------------------------

export type RsiSignal = 'oversold' | 'neutral' | 'overbought'
export type SmaCross = 'golden' | 'death' | 'neither'
export type MacdState = 'bullish' | 'bearish'
export type BollingerPosition = 'near_lower' | 'middle' | 'near_upper'

export type IndicatorsSummary = {
  bars_analyzed: number
  current_price: number
  rsi_14: number | null
  macd: { line: number; signal: number; histogram: number } | null
  sma_20: number | null
  sma_50: number | null
  sma_200: number | null
  bollinger: { upper: number; middle: number; lower: number } | null
  atr_14: number | null
  range_high: number | null
  range_low: number | null
  price_vs_range_pct: number | null
  signals: {
    rsi: RsiSignal | null
    sma_cross_50_200: SmaCross | null
    price_vs_sma_20: 'above' | 'below' | null
    price_vs_sma_50: 'above' | 'below' | null
    price_vs_sma_200: 'above' | 'below' | null
    macd: MacdState | null
    bollinger: BollingerPosition | null
  }
}

function last<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}

export function summarizeIndicators(bars: OhlcvBar[]): IndicatorsSummary {
  if (bars.length === 0) {
    return {
      bars_analyzed: 0,
      current_price: 0,
      rsi_14: null,
      macd: null,
      sma_20: null,
      sma_50: null,
      sma_200: null,
      bollinger: null,
      atr_14: null,
      range_high: null,
      range_low: null,
      price_vs_range_pct: null,
      signals: {
        rsi: null,
        sma_cross_50_200: null,
        price_vs_sma_20: null,
        price_vs_sma_50: null,
        price_vs_sma_200: null,
        macd: null,
        bollinger: null,
      },
    }
  }

  const closes = bars.map((b) => b.close)
  const highs = bars.map((b) => b.high)
  const lows = bars.map((b) => b.low)
  const currentPrice = closes[closes.length - 1]

  const rsi14 = last(rsi(closes, 14))
  const macdRes = macd(closes, 12, 26, 9)
  const macdLine = last(macdRes.macdLine)
  const macdSig = last(macdRes.signalLine)
  const macdHist = last(macdRes.histogram)
  const sma20 = last(sma(closes, 20))
  const sma50 = last(sma(closes, 50))
  const sma200 = last(sma(closes, 200))
  const boll = bollinger(closes, 20, 2)
  const bollU = last(boll.upper)
  const bollM = last(boll.middle)
  const bollL = last(boll.lower)
  const atr14 = last(atr(highs, lows, closes, 14))

  const rangeHigh = Math.max(...highs)
  const rangeLow = Math.min(...lows)
  const priceVsRange =
    rangeHigh > rangeLow
      ? ((currentPrice - rangeLow) / (rangeHigh - rangeLow)) * 100
      : null

  const rsiSig: RsiSignal | null =
    rsi14 == null
      ? null
      : rsi14 > 70
        ? 'overbought'
        : rsi14 < 30
          ? 'oversold'
          : 'neutral'

  const smaCross: SmaCross | null =
    sma50 != null && sma200 != null
      ? sma50 > sma200
        ? 'golden'
        : sma50 < sma200
          ? 'death'
          : 'neither'
      : null

  const priceVsSma = (smaVal: number | null) =>
    smaVal == null ? null : currentPrice >= smaVal ? 'above' : 'below'

  const macdState: MacdState | null =
    macdLine != null && macdSig != null
      ? macdLine > macdSig
        ? 'bullish'
        : 'bearish'
      : null

  // "Near" thresholds: top/bottom 15% of the band width
  const bollPos: BollingerPosition | null =
    bollU != null && bollM != null && bollL != null
      ? currentPrice >= bollU - (bollU - bollL) * 0.15
        ? 'near_upper'
        : currentPrice <= bollL + (bollU - bollL) * 0.15
          ? 'near_lower'
          : 'middle'
      : null

  return {
    bars_analyzed: bars.length,
    current_price: currentPrice,
    rsi_14: rsi14,
    macd:
      macdLine != null && macdSig != null && macdHist != null
        ? { line: macdLine, signal: macdSig, histogram: macdHist }
        : null,
    sma_20: sma20,
    sma_50: sma50,
    sma_200: sma200,
    bollinger:
      bollU != null && bollM != null && bollL != null
        ? { upper: bollU, middle: bollM, lower: bollL }
        : null,
    atr_14: atr14,
    range_high: rangeHigh,
    range_low: rangeLow,
    price_vs_range_pct: priceVsRange,
    signals: {
      rsi: rsiSig,
      sma_cross_50_200: smaCross,
      price_vs_sma_20: priceVsSma(sma20),
      price_vs_sma_50: priceVsSma(sma50),
      price_vs_sma_200: priceVsSma(sma200),
      macd: macdState,
      bollinger: bollPos,
    },
  }
}
