import { z } from 'zod'

// Shared Zod schemas — one place for types that cross boundaries
// (route handler input, AI output, future watchlist/portfolio payloads).

export const HorizonSchema = z.object({
  low: z.number(),
  base: z.number(),
  high: z.number(),
  confidence: z.enum(['low', 'medium', 'high']),
})

export const FactorSchema = z.object({
  title: z.string().min(1),
  weight: z.number().min(0).max(1),
  evidence: z.string().min(1),
})

export const ForecastOutputSchema = z.object({
  horizons: z.object({
    '1w': HorizonSchema,
    '1m': HorizonSchema,
    '3m': HorizonSchema,
  }),
  bullish_factors: z.array(FactorSchema).min(3).max(5),
  bearish_factors: z.array(FactorSchema).min(3).max(5),
  narrative: z.string().min(1),
  risks: z.array(z.string().min(1)).min(3).max(6),
  data_quality_notes: z.string(),
})

export type Horizon = z.infer<typeof HorizonSchema>
export type Factor = z.infer<typeof FactorSchema>
export type ForecastOutput = z.infer<typeof ForecastOutputSchema>
