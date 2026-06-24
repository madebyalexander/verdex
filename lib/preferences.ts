/**
 * Pure types + constants for user-facing preferences. Safe to import from
 * client components — no server-only deps in this file. Read/write helpers
 * (which touch Supabase) live in `lib/preferences.server.ts`.
 */

export type ForecastHorizonKey = '1w' | '1m' | '3m'
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive'
export type ExperienceLevel = 'new' | 'some'
export type LandingRoute =
  | 'dashboard'
  | 'watchlist'
  | 'portfolio'
  | 'compare'
  | 'news'

export type Preferences = {
  default_landing: LandingRoute
  default_forecast_horizon: ForecastHorizonKey
  preferred_sectors: string[]
  risk_profile: RiskProfile
  experience_level: ExperienceLevel
  /** True once the user has completed (or skipped) first-run onboarding. */
  onboarded: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  default_landing: 'dashboard',
  default_forecast_horizon: '1m',
  preferred_sectors: [],
  risk_profile: 'balanced',
  experience_level: 'some',
  onboarded: false,
}

export const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel
  label: string
  description: string
  emoji: string
}[] = [
  {
    value: 'new',
    label: 'New to investing',
    description: 'Show more plain-language explanations and definitions',
    emoji: '🌱',
  },
  {
    value: 'some',
    label: 'Some experience',
    description: 'I know the basics — keep it concise',
    emoji: '📈',
  },
]

/** Display-only emoji per sector. Keys match SECTOR_OPTIONS exactly. */
export const SECTOR_EMOJI: Record<string, string> = {
  Technology: '💻',
  Healthcare: '🏥',
  'Financial Services': '🏦',
  'Consumer Cyclical': '🛍️',
  'Consumer Defensive': '🛒',
  Energy: '🛢️',
  Industrials: '🏭',
  'Communication Services': '📡',
  'Real Estate': '🏠',
  Utilities: '💡',
  'Basic Materials': '⛏️',
}

/** Sectors the user can pick from. Keep aligned with Finnhub industry labels. */
export const SECTOR_OPTIONS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Energy',
  'Industrials',
  'Communication Services',
  'Real Estate',
  'Utilities',
  'Basic Materials',
] as const

export const LANDING_OPTIONS: { value: LandingRoute; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'compare', label: 'Compare' },
  { value: 'news', label: 'News' },
]

export const HORIZON_OPTIONS: { value: ForecastHorizonKey; label: string }[] = [
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
]

export const RISK_OPTIONS: {
  value: RiskProfile
  label: string
  description: string
}[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    description:
      'Wider safety margins · prefer base-case forecasts · highlight downside risks',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Default — equal weight to upside and downside scenarios',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description:
      'Lean into upside · tolerate volatility · less risk-warning copy',
  },
]

export function mergeWithDefaults(raw: unknown): Preferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFERENCES
  const r = raw as Partial<Preferences> & Record<string, unknown>
  return {
    default_landing:
      LANDING_OPTIONS.some((o) => o.value === r.default_landing)
        ? (r.default_landing as LandingRoute)
        : DEFAULT_PREFERENCES.default_landing,
    default_forecast_horizon:
      HORIZON_OPTIONS.some((o) => o.value === r.default_forecast_horizon)
        ? (r.default_forecast_horizon as ForecastHorizonKey)
        : DEFAULT_PREFERENCES.default_forecast_horizon,
    preferred_sectors: Array.isArray(r.preferred_sectors)
      ? r.preferred_sectors.filter(
          (s): s is string =>
            typeof s === 'string' &&
            (SECTOR_OPTIONS as readonly string[]).includes(s)
        )
      : DEFAULT_PREFERENCES.preferred_sectors,
    risk_profile: RISK_OPTIONS.some((o) => o.value === r.risk_profile)
      ? (r.risk_profile as RiskProfile)
      : DEFAULT_PREFERENCES.risk_profile,
    experience_level:
      r.experience_level === 'new' || r.experience_level === 'some'
        ? r.experience_level
        : DEFAULT_PREFERENCES.experience_level,
    onboarded: r.onboarded === true,
  }
}
