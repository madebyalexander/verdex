import { describe, it, expect } from 'vitest'
import {
  sma,
  ema,
  rsi,
  macd,
  bollinger,
  atr,
  summarizeIndicators,
} from '@/lib/indicators'
import type { OhlcvBar } from '@/lib/apis/alpha-vantage'

// ---------------------------------------------------------------------
// sma
// ---------------------------------------------------------------------
describe('sma', () => {
  it('returns empty when fewer values than period', () => {
    expect(sma([1, 2], 5)).toEqual([])
  })

  it('produces N-period+1 values', () => {
    const out = sma([1, 2, 3, 4, 5], 3)
    expect(out).toHaveLength(3)
    expect(out).toEqual([2, 3, 4])
  })

  it('handles period equal to length', () => {
    expect(sma([10, 20, 30], 3)).toEqual([20])
  })
})

// ---------------------------------------------------------------------
// ema
// ---------------------------------------------------------------------
describe('ema', () => {
  it('returns empty when fewer values than period', () => {
    expect(ema([1, 2], 5)).toEqual([])
  })

  it('seeds first value with SMA, smooths thereafter', () => {
    // period=3, k=2/4=0.5
    // seed = (1+2+3)/3 = 2; next = (4-2)*0.5 + 2 = 3; next = (5-3)*0.5 + 3 = 4
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4])
  })

  it('responds faster to new data than sma', () => {
    const vals = [10, 10, 10, 10, 20]
    const smaVal = sma(vals, 4).at(-1)!
    const emaVal = ema(vals, 4).at(-1)!
    // EMA weights the new value more, so it should be higher
    expect(emaVal).toBeGreaterThan(smaVal)
  })
})

// ---------------------------------------------------------------------
// rsi
// ---------------------------------------------------------------------
describe('rsi', () => {
  it('returns empty when not enough data', () => {
    expect(rsi([1, 2, 3], 14)).toEqual([])
  })

  it('returns 100 for monotonically increasing series', () => {
    // All gains, zero losses → RSI = 100
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i)
    const out = rsi(closes, 14)
    expect(out.at(-1)).toBeGreaterThan(99)
  })

  it('returns close to 0 for monotonically decreasing series', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 200 - i)
    const out = rsi(closes, 14)
    expect(out.at(-1)).toBeLessThan(1)
  })

  it('returns near 50 for choppy/flat series', () => {
    const closes = [50, 51, 50, 51, 50, 51, 50, 51, 50, 51, 50, 51, 50, 51, 50, 51]
    const out = rsi(closes, 14)
    expect(out.at(-1)).toBeGreaterThan(40)
    expect(out.at(-1)).toBeLessThan(60)
  })
})

// ---------------------------------------------------------------------
// macd
// ---------------------------------------------------------------------
describe('macd', () => {
  it('returns empty arrays for short input', () => {
    const out = macd([1, 2, 3])
    expect(out.macdLine).toEqual([])
    expect(out.signalLine).toEqual([])
    expect(out.histogram).toEqual([])
  })

  it('produces aligned arrays when fed enough data', () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 3) * 5)
    const out = macd(closes, 12, 26, 9)
    expect(out.macdLine.length).toBeGreaterThan(0)
    expect(out.signalLine.length).toBeGreaterThan(0)
    expect(out.histogram.length).toEqual(out.signalLine.length)
  })

  it('histogram = macdLine - signalLine at each aligned position', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.3)
    const { macdLine, signalLine, histogram } = macd(closes)
    const offset = macdLine.length - signalLine.length
    for (let i = 0; i < signalLine.length; i++) {
      expect(histogram[i]).toBeCloseTo(macdLine[i + offset] - signalLine[i], 6)
    }
  })
})

// ---------------------------------------------------------------------
// bollinger
// ---------------------------------------------------------------------
describe('bollinger', () => {
  it('returns empty when fewer values than period', () => {
    const out = bollinger([1, 2], 20)
    expect(out.upper).toEqual([])
    expect(out.middle).toEqual([])
    expect(out.lower).toEqual([])
  })

  it('middle equals SMA', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 50 + i)
    const { middle } = bollinger(closes, 20, 2)
    const smaOut = sma(closes, 20)
    expect(middle).toEqual(smaOut)
  })

  it('upper > middle > lower at every point', () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 4) * 8)
    const { upper, middle, lower } = bollinger(closes, 20, 2)
    for (let i = 0; i < upper.length; i++) {
      expect(upper[i]).toBeGreaterThan(middle[i])
      expect(middle[i]).toBeGreaterThan(lower[i])
    }
  })

  it('collapses to a point when all values are identical', () => {
    const closes = Array.from({ length: 25 }, () => 100)
    const { upper, middle, lower } = bollinger(closes, 20, 2)
    expect(upper.at(-1)).toEqual(100)
    expect(middle.at(-1)).toEqual(100)
    expect(lower.at(-1)).toEqual(100)
  })
})

// ---------------------------------------------------------------------
// atr
// ---------------------------------------------------------------------
describe('atr', () => {
  it('returns empty when fewer values than period+1', () => {
    expect(atr([1], [1], [1], 14)).toEqual([])
  })

  it('produces positive values on a noisy series', () => {
    const highs = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) + 2)
    const lows = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) - 2)
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i))
    const out = atr(highs, lows, closes, 14)
    expect(out.length).toBeGreaterThan(0)
    out.forEach((v) => expect(v).toBeGreaterThan(0))
  })
})

// ---------------------------------------------------------------------
// summarizeIndicators integration
// ---------------------------------------------------------------------
describe('summarizeIndicators', () => {
  it('returns null fields on empty input', () => {
    const s = summarizeIndicators([])
    expect(s.bars_analyzed).toEqual(0)
    expect(s.rsi_14).toBeNull()
    expect(s.macd).toBeNull()
  })

  it('flags golden cross when sma50 > sma200', () => {
    // Build 250 bars: gradual uptrend so sma50 (recent) > sma200 (long-term)
    const bars: OhlcvBar[] = Array.from({ length: 250 }, (_, i) => {
      const price = 100 + i * 0.5
      return {
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: price,
        high: price + 1,
        low: price - 1,
        close: price,
        volume: 1000,
      }
    })
    const s = summarizeIndicators(bars)
    expect(s.signals.sma_cross_50_200).toEqual('golden')
  })

  it('flags overbought RSI for strongly rising prices', () => {
    const bars: OhlcvBar[] = Array.from({ length: 50 }, (_, i) => {
      const price = 100 + i
      return {
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: price,
        high: price + 0.5,
        low: price - 0.5,
        close: price,
        volume: 1000,
      }
    })
    const s = summarizeIndicators(bars)
    expect(s.signals.rsi).toEqual('overbought')
  })

  it('computes range_high/range_low across all bars', () => {
    const bars: OhlcvBar[] = [
      { time: '2024-01-01', open: 100, high: 110, low: 90, close: 105, volume: 1 },
      { time: '2024-01-02', open: 105, high: 120, low: 100, close: 115, volume: 1 },
      { time: '2024-01-03', open: 115, high: 118, low: 85, close: 110, volume: 1 },
    ]
    const s = summarizeIndicators(bars)
    expect(s.range_high).toEqual(120)
    expect(s.range_low).toEqual(85)
  })
})
