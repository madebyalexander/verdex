import { GoogleGenAI } from '@google/genai'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  ForecastOutputSchema,
  type ForecastOutput,
} from '@/lib/zod-schemas'

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (_client) return _client
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY missing in .env.local (get one free at https://aistudio.google.com/apikey)'
    )
  }
  _client = new GoogleGenAI({ apiKey })
  return _client
}

let cachedForecastPrompt: string | null = null
async function loadSystemPrompt(): Promise<string> {
  if (cachedForecastPrompt) return cachedForecastPrompt
  const p = path.join(process.cwd(), 'prompts', 'forecast-system.md')
  cachedForecastPrompt = await readFile(p, 'utf-8')
  return cachedForecastPrompt
}

// JSON Schema mirror of ForecastOutputSchema. Gemini accepts a subset of
// OpenAPI 3.0 schema — same shape we use for Anthropic tool_use input.
const horizonJson = {
  type: 'object',
  properties: {
    low: { type: 'number' },
    base: { type: 'number' },
    high: { type: 'number' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['low', 'base', 'high', 'confidence'],
} as const

const factorJson = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    weight: { type: 'number', minimum: 0, maximum: 1 },
    evidence: { type: 'string' },
  },
  required: ['title', 'weight', 'evidence'],
} as const

const responseSchema = {
  type: 'object',
  properties: {
    horizons: {
      type: 'object',
      properties: { '1w': horizonJson, '1m': horizonJson, '3m': horizonJson },
      required: ['1w', '1m', '3m'],
    },
    bullish_factors: {
      type: 'array',
      items: factorJson,
      minItems: 3,
      maxItems: 5,
    },
    bearish_factors: {
      type: 'array',
      items: factorJson,
      minItems: 3,
      maxItems: 5,
    },
    narrative: { type: 'string' },
    risks: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 6,
    },
    data_quality_notes: { type: 'string' },
  },
  required: [
    'horizons',
    'bullish_factors',
    'bearish_factors',
    'narrative',
    'risks',
    'data_quality_notes',
  ],
}

export async function callGemini(
  bundle: unknown,
  prevError?: string
): Promise<ForecastOutput> {
  const systemInstruction = await loadSystemPrompt()
  const userPrompt = prevError
    ? `Your previous response failed validation: ${prevError}. Return a valid forecast that strictly matches the schema. Input data:\n\n${JSON.stringify(bundle, null, 2)}`
    : JSON.stringify(bundle, null, 2)

  const response = await client().models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
      temperature: 0.7,
    },
  })

  const text = response.text
  if (!text) {
    throw new Error('Gemini returned empty response')
  }
  const raw = JSON.parse(text)
  return ForecastOutputSchema.parse(raw)
}
