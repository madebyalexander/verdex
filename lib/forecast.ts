import { z } from 'zod'
import { redis } from './cache'
import { supabaseAdmin } from './supabase/admin'
import {
  getQuote,
  getProfile,
  getCompanyNews,
  getRecommendations,
  getInsiderTransactions,
  getStockMetrics,
  getUpcomingEarnings,
} from './apis/finnhub'
import { getDailyOhlcv, type OhlcvBar } from './apis/alpha-vantage'
import { summarizeIndicators } from './indicators'
import { callGemini, GEMINI_MODEL } from './apis/gemini'
import { type ForecastOutput } from './zod-schemas'

const FORECAST_TTL_SECONDS = 12 * 60 * 60 // SPEC §10

const cacheKey = (symbol: string) => `forecast:gemini:${symbol}`

// Finnhub returns broad industry strings ("Technology", "Pharmaceuticals",
// "Banking", etc.). Map them to SPDR Select Sector ETF symbols so we can
// fetch sector performance via Alpha Vantage candles.
function sectorToETF(industry: string | null | undefined): string | null {
  if (!industry) return null
  const s = industry.toLowerCase()
  if (/tech|software|semiconductor|electronic|hardware/.test(s)) return 'XLK'
  if (/bank|financ|insur|capital market|asset manag/.test(s)) return 'XLF'
  if (/health|pharma|biotech|medical|hospital/.test(s)) return 'XLV'
  if (/communication|media|telecom|interactive/.test(s)) return 'XLC'
  if (/retail|auto|travel|leisure|apparel|hotel|restaurant|luxury/.test(s))
    return 'XLY'
  if (/staple|food|beverage|tobacco|household/.test(s)) return 'XLP'
  if (/industrial|aerospace|defense|transport|logistic|machinery/.test(s))
    return 'XLI'
  if (/oil|gas|energy|petroleum/.test(s)) return 'XLE'
  if (/utilit|electric|water/.test(s)) return 'XLU'
  if (/reit|real estate|property/.test(s)) return 'XLRE'
  if (/material|chemical|metal|mining|paper/.test(s)) return 'XLB'
  return null
}

function trendPct(
  bars: OhlcvBar[] | null,
  lookbackBars: number
): number | null {
  if (!bars || bars.length < lookbackBars + 1) return null
  const recent = bars[bars.length - 1]
  const past = bars[bars.length - 1 - lookbackBars]
  if (past.close === 0) return null
  return ((recent.close - past.close) / past.close) * 100
}

function isWithinDays(dateStr: string, days: number): boolean {
  const target = new Date(dateStr).getTime()
  if (isNaN(target)) return false
  const diffDays = (target - Date.now()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= days
}

async function gatherBundle(symbol: string) {
  const swallow =
    (label: string) =>
    (err: unknown) => {
      console.error(`[forecast.gatherBundle ${label}]`, err)
      return null
    }

  const [
    quote,
    profile,
    newsSettled,
    recsSettled,
    insidersSettled,
    metricsSettled,
    candlesSettled,
  ] = await Promise.all([
    getQuote(symbol),
    getProfile(symbol),
    getCompanyNews(symbol, 30).catch(swallow('news')),
    getRecommendations(symbol).catch(swallow('recommendations')),
    getInsiderTransactions(symbol, 90).catch(swallow('insiders')),
    getStockMetrics(symbol).catch(swallow('metrics')),
    getDailyOhlcv(symbol).catch(swallow('candles')),
  ])

  const indicators =
    candlesSettled && candlesSettled.length > 0
      ? summarizeIndicators(candlesSettled)
      : null

  // Phase 2: macro context — needs profile.finnhubIndustry to pick sector ETF.
  const sectorEtfSym = sectorToETF(profile.finnhubIndustry)
  const [spyBars, sectorBars, vixQuote, earningsList] = await Promise.all([
    getDailyOhlcv('SPY').catch(swallow('SPY candles')),
    sectorEtfSym
      ? getDailyOhlcv(sectorEtfSym).catch(swallow('sector candles'))
      : Promise.resolve(null),
    getQuote('^VIX').catch(() => getQuote('VXX').catch(() => null)),
    getUpcomingEarnings(symbol, 90).catch(swallow('earnings')),
  ])

  const nextEarnings = earningsList?.[0] ?? null
  const macro = {
    spy_trend_1m_pct: trendPct(spyBars, 21),
    spy_trend_3m_pct: trendPct(spyBars, 63),
    sector_etf: sectorEtfSym,
    sector_trend_1m_pct: trendPct(sectorBars, 21),
    sector_trend_3m_pct: trendPct(sectorBars, 63),
    volatility_proxy: vixQuote
      ? {
          symbol: '^VIX-or-VXX',
          current: vixQuote.c,
          change_today_pct: vixQuote.dp ?? null,
          note: 'Tried ^VIX first, fell back to VXX (volatility ETN) on failure. Interpret as directional volatility signal, not absolute VIX level.',
        }
      : null,
    next_earnings_date: nextEarnings?.date ?? null,
    next_earnings_eps_estimate: nextEarnings?.epsEstimate ?? null,
    next_earnings_revenue_estimate: nextEarnings?.revenueEstimate ?? null,
    earnings_within_14_days: nextEarnings
      ? isWithinDays(nextEarnings.date, 14)
      : false,
  }

  // News — trim to top 15 articles, cap summary length (token budget)
  const newsForBundle =
    newsSettled?.slice(0, 15).map((a) => ({
      date: new Date(a.datetime * 1000).toISOString().slice(0, 10),
      source: a.source ?? null,
      headline: a.headline,
      summary: (a.summary ?? '').slice(0, 400),
    })) ?? null

  // Analyst trends — newest first; pass last 6 months to show consensus shift.
  const analyst = recsSettled?.length
    ? {
        most_recent: recsSettled[0],
        previous_month: recsSettled[1] ?? null,
        three_months_ago: recsSettled[2] ?? null,
        history_6mo: recsSettled.slice(0, 6),
      }
    : null

  // Insider activity — counts + recent transactions
  const insider = insidersSettled?.length
    ? {
        count_90d: insidersSettled.length,
        buys_count: insidersSettled.filter((t) => (t.change ?? 0) > 0).length,
        sells_count: insidersSettled.filter((t) => (t.change ?? 0) < 0).length,
        net_shares_change: insidersSettled.reduce(
          (sum, t) => sum + (t.change ?? 0),
          0
        ),
        recent: insidersSettled
          .slice()
          .sort((a, b) =>
            (b.transactionDate ?? '').localeCompare(a.transactionDate ?? '')
          )
          .slice(0, 10)
          .map((t) => ({
            date: t.transactionDate ?? null,
            name: t.name,
            code: t.transactionCode ?? null,
            shares: t.share ?? null,
            change: t.change ?? null,
            price: t.transactionPrice ?? null,
          })),
      }
    : null

  return {
    symbol,
    company_name: profile.name,
    as_of_timestamp: new Date().toISOString(),
    technical: {
      current_price: quote.c,
      open_today: quote.o,
      high_today: quote.h,
      low_today: quote.l,
      previous_close: quote.pc,
      change_today: quote.d,
      change_today_pct: quote.dp,
      indicators,
    },
    fundamentals: {
      market_cap_usd_millions: profile.marketCapitalization ?? null,
      shares_outstanding_millions: profile.shareOutstanding ?? null,
      currency: profile.currency ?? 'USD',
      metrics: metricsSettled ?? null,
    },
    company_context: {
      industry: profile.finnhubIndustry ?? null,
      country: profile.country ?? null,
      exchange: profile.exchange ?? null,
      ipo_date: profile.ipo ?? null,
    },
    news: newsForBundle,
    analyst,
    insider,
    macro,
    data_completeness: {
      technical_indicators: indicators
        ? `present — RSI(14), MACD(12,26,9), SMA 20/50/200, Bollinger(20,2σ), ATR(14) computed from ${indicators.bars_analyzed} daily bars`
        : 'missing — candle data fetch failed',
      fundamentals_extended: metricsSettled
        ? 'present — Finnhub /stock/metric (P/E, EPS, margins, ROE, debt/equity, beta, 52w hi/lo, etc.)'
        : 'missing — Finnhub /stock/metric returned no data',
      news_sentiment: newsForBundle
        ? `partial — ${newsForBundle.length} recent headlines + summaries provided; infer sentiment from text yourself`
        : 'missing — news fetch failed',
      analyst_recommendations: analyst
        ? `present — ${recsSettled?.length ?? 0} months of analyst buy/hold/sell trends`
        : 'missing — no analyst recommendation data',
      insider_activity: insider
        ? `present — ${insider.count_90d} insider transactions in last 90 days (${insider.buys_count} buys, ${insider.sells_count} sells)`
        : 'missing — no insider transactions in last 90 days',
      macro_context:
        macro.spy_trend_1m_pct != null || macro.volatility_proxy
          ? `present — SPY 1m/3m trend${macro.sector_etf ? `, sector ETF ${macro.sector_etf} 1m/3m trend` : ''}${macro.volatility_proxy ? ', volatility proxy' : ''}, next earnings date${macro.earnings_within_14_days ? ' (WITHIN 14 DAYS — flag elevated event risk)' : ''}`
          : 'missing — all macro fetches failed',
      historical_ohlc:
        candlesSettled && candlesSettled.length > 0
          ? `present — ${candlesSettled.length} daily bars (Alpha Vantage)`
          : 'missing — no candle data',
    },
  }
}

async function getLastFromPostgres(symbol: string) {
  const { data } = await supabaseAdmin
    .from('ai_predictions')
    .select('prediction, model, generated_at')
    .eq('symbol', symbol)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export type ForecastResult = {
  forecast: ForecastOutput
  source: 'cache' | 'fresh' | 'fallback'
  generated_at: string | null
  model: string
}

export async function getCachedForecast(
  symbol: string
): Promise<ForecastOutput | null> {
  return redis.get<ForecastOutput>(cacheKey(symbol))
}

export async function generateFreshForecast(
  symbol: string
): Promise<ForecastResult> {
  const bundle = await gatherBundle(symbol)

  let forecast: ForecastOutput
  try {
    try {
      forecast = await callGemini(bundle)
    } catch (err) {
      // One retry with the error included if Zod validation failed.
      if (err instanceof z.ZodError) {
        const errStr = err.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
        forecast = await callGemini(bundle, errStr)
      } else {
        throw err
      }
    }
  } catch (err) {
    // Final fallback per CLAUDE.md rule #5: last cached prediction (any age)
    const fallback = await getLastFromPostgres(symbol)
    if (fallback) {
      return {
        forecast: fallback.prediction as ForecastOutput,
        source: 'fallback',
        generated_at: fallback.generated_at,
        model: fallback.model,
      }
    }
    throw err
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + FORECAST_TTL_SECONDS * 1000)

  // Cache writes are best-effort — don't fail the response if either fails
  await Promise.allSettled([
    redis.set(cacheKey(symbol), forecast, { ex: FORECAST_TTL_SECONDS }),
    supabaseAdmin.from('ai_predictions').insert({
      symbol,
      prediction: forecast,
      model: GEMINI_MODEL,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }),
  ])

  return {
    forecast,
    source: 'fresh',
    generated_at: now.toISOString(),
    model: GEMINI_MODEL,
  }
}
