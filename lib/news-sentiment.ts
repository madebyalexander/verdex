import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { redis } from '@/lib/cache'
import { GEMINI_MODEL } from '@/lib/apis/gemini'

export type Sentiment = 'positive' | 'negative' | 'neutral'

// News is immutable once published, so a classified headline can cache for long.
const SENT_TTL = 60 * 60 * 24 * 14 // 14 days
const KEY = (id: number) => `news:sent:v1:${id}`

type Input = { id: number; headline: string }

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (_client) return _client
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY missing in .env.local')
  _client = new GoogleGenAI({ apiKey })
  return _client
}

const BatchSchema = z.object({
  items: z.array(
    z.object({
      i: z.number(),
      sentiment: z.enum(['positive', 'negative', 'neutral']),
    })
  ),
})

const responseSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'number' },
          sentiment: {
            type: 'string',
            enum: ['positive', 'negative', 'neutral'],
          },
        },
        required: ['i', 'sentiment'],
      },
    },
  },
  required: ['items'],
}

const SYSTEM = `You are a financial-news sentiment classifier. For each item, judge the likely market sentiment toward the primary company/stock in the headline:
- "positive": bullish — likely to push the stock up (beats, upgrades, deals, growth, buybacks).
- "negative": bearish — likely to push the stock down (misses, downgrades, lawsuits, layoffs, declines, probes).
- "neutral": ambiguous, mixed, or no clear directional implication.
Return JSON only, exactly one entry per input item, echoing back its index "i".`

/** Classify all items in a single model request, keyed by array index. */
async function classifyAll(items: Input[]): Promise<Map<number, Sentiment>> {
  const payload = items.map((it, i) => ({ i, headline: it.headline }))
  const response = await client().models.generateContent({
    model: GEMINI_MODEL,
    contents: JSON.stringify(payload),
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
      temperature: 0,
    },
  })
  const text = response.text
  if (!text) throw new Error('Gemini returned empty response')
  const parsed = BatchSchema.parse(JSON.parse(text))
  const m = new Map<number, Sentiment>()
  for (const it of parsed.items) m.set(it.i, it.sentiment)
  return m
}

const POSITIVE = [
  'beat', 'beats', 'tops', 'surge', 'surges', 'soar', 'soars', 'jump', 'jumps',
  'rise', 'rises', 'gain', 'gains', 'upgrade', 'upgraded', 'record', 'growth',
  'profit', 'raises', 'boost', 'rally', 'rallies', 'win', 'wins', 'approval',
  'approved', 'breakthrough', 'outperform', 'strong', 'higher', 'soaring',
  'buyback', 'dividend', 'expands', 'partnership',
]
const NEGATIVE = [
  'miss', 'misses', 'plunge', 'plunges', 'fall', 'falls', 'drop', 'drops',
  'sink', 'sinks', 'slump', 'slumps', 'tumble', 'tumbles', 'downgrade',
  'downgraded', 'cut', 'cuts', 'layoff', 'layoffs', 'lawsuit', 'probe',
  'investigation', 'decline', 'declines', 'loss', 'losses', 'weak', 'warning',
  'warns', 'recall', 'halts', 'lower', 'slide', 'slides', 'crash', 'crashes',
  'fraud', 'bankruptcy', 'sues', 'slashes', 'plummets',
]

/** Cheap lexicon fallback used only when the model is unavailable. */
function heuristicSentiment(headline: string): Sentiment {
  const words = headline.toLowerCase().match(/[a-z']+/g) ?? []
  let score = 0
  for (const w of words) {
    if (POSITIVE.includes(w)) score++
    else if (NEGATIVE.includes(w)) score--
  }
  return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
}

/**
 * Classify each article's headline as positive/negative/neutral. Gemini is the
 * primary classifier (one request per cold load, cached per-article id). If the
 * model is unavailable (e.g. quota), uncached items fall back to a keyword
 * heuristic — not cached, so the model reclassifies once it's available again.
 * Never throws.
 */
export async function classifyNewsSentiment(
  articles: Input[]
): Promise<Map<number, Sentiment>> {
  const out = new Map<number, Sentiment>()
  if (articles.length === 0) return out

  const cached = await Promise.all(
    articles.map((a) => redis.get<Sentiment>(KEY(a.id)).catch(() => null))
  )
  const uncached: Input[] = []
  articles.forEach((a, i) => {
    const c = cached[i]
    if (c === 'positive' || c === 'negative' || c === 'neutral') out.set(a.id, c)
    else uncached.push(a)
  })
  if (uncached.length === 0) return out

  let ai: Map<number, Sentiment> | null = null
  try {
    ai = await classifyAll(uncached)
  } catch (err) {
    console.error(
      '[classifyNewsSentiment] model unavailable, using heuristic:',
      err instanceof Error ? err.message : err
    )
  }

  const writes: Promise<unknown>[] = []
  uncached.forEach((a, i) => {
    const fromAi = ai?.get(i)
    if (fromAi) {
      out.set(a.id, fromAi)
      writes.push(redis.set(KEY(a.id), fromAi, { ex: SENT_TTL }).catch(() => {}))
    } else {
      out.set(a.id, heuristicSentiment(a.headline))
    }
  })
  await Promise.all(writes)
  return out
}
