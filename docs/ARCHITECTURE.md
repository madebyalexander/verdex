# Verdex — Architecture & Implementation Reference

> Investment-assistant web app with AI-powered stock price forecasting.
> Reference for product scope, architecture, data pipeline, and conventions.

---

## 1. Product Overview

**Verdex** is a web application that helps retail investors make data-driven decisions. The flagship feature is an **AI-generated stock price forecast** with transparent reasoning — built by synthesizing technical indicators, fundamentals, news sentiment, analyst recommendations, and insider activity.

**Core value:** remove the "black box" from investment decisions. The AI doesn't just output a number — it shows which factors influenced the forecast and how much weight each carried.

**Target users:** retail investors (beginner-to-intermediate), people who want to study the market before acting. **Not** for professional/HFT/options/derivatives traders.

---

## 2. Key User Scenarios

1. "I've heard about NVDA — what's happening with it and where is the price heading?"
2. "Compare TSLA vs RIVN before I buy."
3. "Save 10 stocks to a watchlist and monitor them."
4. "Notify me if AAPL drops below $180."
5. "Track my actual positions and see P/L."
6. "What matters in today's market? What are the AI's picks?"

---

## 3. Tech Stack (FIXED — do not swap without approval)

### Frontend
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **shadcn/ui** (built on `@base-ui/react` primitives + Tailwind v4 + `class-variance-authority`) — the primary UI library. Components are generated locally into [components/ui/](./components/ui/) and we own the source. Components currently in use:
  - **`dialog`**, **`alert-dialog`** — confirmations, first-run disclaimer, alert creation
  - **`card`** — every section container (KPIs, chart, forecast, news, etc.)
  - **`button`**, **`input`** — primary form primitives
  - **`badge`** — sector tags (plus our custom **`change-badge`** for green/red price-change pills in [components/ui/change-badge.tsx](./components/ui/change-badge.tsx))
  - **`skeleton`** — loading states under every Suspense boundary
  - **`separator`** — divider lines in lists and stat groups
  - **`sonner`** — global toast notifications (mounted once in `app/(app)/layout.tsx`)
- **Companion libraries (sanctioned additions):**
  - Charts → **`recharts`** (line / area / bar / pie / composed / radar)
  - Stock OHLC/candlestick → **TradingView Lightweight Charts** (`lightweight-charts`) — used ONLY for price charts with OHLC + volume + indicator overlays. Everything else (sentiment over time, allocation pie, sector bars, fundamentals trends) uses Recharts.
  - Icons → **`lucide-react`**
  - Toasts → **`sonner`**
- **Tailwind CSS v4** — CSS-first config in [app/globals.css](./app/globals.css). We override the dark variant with `@custom-variant dark (&:where(.dark, .dark *));` so `dark:` keys off the hardcoded `.dark` class instead of `prefers-color-scheme`.
- **TanStack Query v5** — client-side fetching/caching
- **Zustand** — lightweight UI state (filters, selected timeframe)
- **Inter** — the only font. Loaded via `next/font/google`; all CSS font variables (`--font-sans`, `--font-mono`, `--font-heading`) point at the Inter variable.
- **NO theme library.** Dark mode only — `next-themes` is intentionally excluded. `data-theme="dark"` + `class="dark"` are hardcoded on `<html>` in [app/layout.tsx](./app/layout.tsx).

### Backend
- **Next.js Route Handlers** (`app/api/*`) — proxy all external APIs server-side; keys never reach the client
- **Supabase** (free tier):
  - PostgreSQL — users, watchlists, portfolios, alerts, AI cache
  - Auth — email/password + Google OAuth
  - Row-Level Security to isolate user data
- **Upstash Redis** (free tier, 10k commands/day) — cache external API responses + rate limiting
- **Supabase JS client** — typed Postgres access (we did not adopt Prisma)
- **Vercel Cron** — background pre-warming of forecasts for popular tickers

### AI Layer
- **Google Gemini SDK** (`@google/genai`) — model `gemini-2.5-flash` for forecast synthesis (env: `GEMINI_MODEL`)
- **Structured output** via Gemini's `responseSchema` — JSON shape is enforced by the model, then Zod-validated server-side
- Local technical indicators in [lib/indicators.ts](./lib/indicators.ts) — SMA, EMA, RSI (Wilder's), MACD, Bollinger Bands, ATR — computed from OHLC bars; no external indicators API

### DevOps
- **Vercel** hosting (free hobby tier to start)
- **GitHub Actions** CI (lint, typecheck, build)
- **Sentry** (free tier) for production error tracking
- **husky** + **lint-staged** for pre-commit hooks

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  BROWSER (shadcn/ui)                         │
│  Dashboard │ Stock Detail │ Compare │ Watchlist │ Portfolio  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS + TanStack Query
┌──────────────────────▼──────────────────────────────────────┐
│              NEXT.JS API ROUTES (server-only)                │
│  /api/stocks/[symbol]      /api/predict/[symbol]             │
│  /api/search                /api/news/[symbol]               │
│  /api/watchlist             /api/portfolio                   │
│  /api/alerts                /api/compare                     │
└──────┬────────────┬──────────────┬───────────────┬──────────┘
       ▼            ▼              ▼               ▼
┌──────────┐ ┌──────────┐ ┌────────────────┐ ┌──────────────┐
│ Upstash  │ │ Supabase │ │ External Data  │ │   Google     │
│  Redis   │ │ Postgres │ │  APIs (Finnhub,│ │   Gemini     │
│  (cache  │ │ + Auth   │ │  AlphaVantage, │ │  (forecast   │
│  + rate) │ │          │ │  Marketaux...) │ │   engine)    │
└──────────┘ └──────────┘ └────────────────┘ └──────────────┘
```

**Principles:**
- All external API keys are server-only — the client never sees them
- Every external call goes through Redis cache with a TTL per data type
- AI forecasts are not regenerated per request — cached for 12–24 hours
- Real-time quotes via Finnhub WebSocket (free) proxied through a server handler that fans out to subscribed clients via SSE or shared connection

---

## 5. Feature List (with priority)

### MVP (Phase 1 — required)
1. **Auth** — email + Google OAuth (Supabase Auth) + `profiles` row creation
2. **Stock search** — `Autocomplete` by ticker or company name
3. **Stock detail page:**
   - Current price + daily change (real-time refresh)
   - Interactive chart (1D / 1W / 1M / 6M / 1Y / 5Y)
   - Logo, brief company profile (sector, industry, description)
   - Key metrics (P/E, EPS, market cap, dividend yield, 52w high/low)
4. **AI forecast** — three horizons (1 week, 1 month, 3 months):
   - Forecasted range (low / base / high)
   - Confidence level (Low / Medium / High)
   - Top-5 bullish and bearish factors with weights
   - Plain-text narrative from the AI
   - List of risks
5. **Watchlist** — add/remove, ONE watchlist per user in MVP
6. **News feed** on the stock page with sentiment scores

### Phase 2 (important)
7. **Dashboard** — market indices (S&P500, NASDAQ, DOW, VIX), top gainers/losers, watchlist summary, daily AI insights
8. **Stock comparison** — up to 4 tickers: overlay chart + comparison table + AI-generated comparison narrative
9. **Price alerts** — notifications when price crosses threshold (web push via service worker + email via Supabase)
10. **Technical indicators** on stock page: RSI, MACD, SMA 20/50/200, Bollinger Bands (rendered as overlays on chart and as standalone panels)
11. **Analyst recommendations** — buy/hold/sell distribution + average price target
12. **Insider trading** — recent insider transactions table

### Phase 3 (nice-to-have)
13. **Portfolio tracker** — manual position entry (qty, cost basis, date), P/L calculation, allocation pie
14. **Multiple watchlists** — folders (Tech, Dividends, Speculative, etc.)
15. **Global news feed** with sentiment filtering
16. **Earnings calendar** — upcoming earnings reports
17. **AI Insights feed** — daily AI-curated picks based on movement
18. **CSV export** of watchlist / portfolio

---

## 6. Data Inputs for AI Forecast

For each ticker, build a structured JSON bundle from the following sources. Weights are an INITIAL configuration — the AI reasons over them flexibly.

### Technical analysis (~30% weight)
- OHLCV history (1 year, daily candles)
- **RSI(14)** — overbought/oversold
- **MACD(12,26,9)** — momentum and crossover
- **SMA 20, 50, 200** — trend identification, golden/death cross
- **Bollinger Bands(20, 2)** — volatility and breakout
- **Volume profile** — unusual volume detection (vs 20d avg)
- **ATR(14)** — average true range / volatility
- 52-week high/low + current relative position (%)

### Fundamentals (~25%)
- P/E, Forward P/E, PEG
- P/B, P/S
- EPS (TTM), EPS growth (YoY, 5y CAGR)
- Revenue growth (YoY)
- Profit margin, operating margin
- ROE, ROA
- Debt/Equity ratio
- Dividend yield, payout ratio
- Free cash flow (TTM)
- Sector median comparison for key ratios

### News sentiment (~20%)
- Last 30 days of ticker-specific news (headline, source, date, URL)
- Per-article sentiment (positive/neutral/negative + score in -1..+1)
- Aggregate sentiment over 7d and 30d windows
- Trending topics / keywords

### Analyst recommendations (~10%)
- Buy/hold/sell distribution (Finnhub `/stock/recommendation`)
- Average, low, high price targets
- 3-month consensus shift

### Insider & institutional activity (~10%)
- Insider transactions in last 90 days (buys vs sells, total volumes)
- Institutional holding changes (when available)

### Macro & sector context (~5%)
- Sector ETF performance (1m, 3m)
- Current VIX (market fear gauge)
- S&P 500 trend (1m direction)
- Upcoming earnings date (binary flag: within 14 days)

---

## 7. AI Forecast Pipeline

### Flow

```
[User opens stock] → [Check Redis: fresh forecast?] 
                          │
                  ┌───────┴───────┐
                YES               NO
                  │               │
                  ▼               ▼
            [Return cache]  [Gather all data in parallel]
                                  │
                                  ▼
                       [Build structured prompt]
                                  │
                                  ▼
                       [Call Gemini w/ responseSchema]
                                  │
                                  ▼
                       [Validate JSON response (Zod)]
                                  │
                                  ▼
                       [Store in Redis + Postgres]
                                  │
                                  ▼
                            [Return to user]
```

### System Prompt
The system prompt lives in [prompts/forecast-system.md](./prompts/forecast-system.md). It is loaded once at module init in [lib/apis/gemini.ts](./lib/apis/gemini.ts). See that file for full text.

### User Prompt
Structured JSON containing every data point from Section 6, plus:
- `symbol`, `company_name`, `as_of_timestamp`
- A `data_completeness` map noting which fields could not be fetched

### Output Schema (Zod-validated)

```typescript
{
  horizons: {
    "1w": { low: number, base: number, high: number, confidence: "low" | "medium" | "high" },
    "1m": { low: number, base: number, high: number, confidence: "low" | "medium" | "high" },
    "3m": { low: number, base: number, high: number, confidence: "low" | "medium" | "high" }
  },
  bullish_factors: Array<{ title: string, weight: number /* 0-1 */, evidence: string }>,
  bearish_factors: Array<{ title: string, weight: number, evidence: string }>,
  narrative: string, // 2-3 paragraphs, plain English
  risks: string[],
  data_quality_notes: string
}
```

### Caching & cost control
- Forecasts cached in Postgres (`ai_predictions`) + Redis (key: `forecast:gemini:${symbol}`) for **12 hours** by default
- Pre-warming via Vercel Cron every 12h for top-100 popular tickers
- Manual refresh button — rate-limited to 1/hour per user via Upstash Ratelimit

### Output validation
- Zod schema validation on every Gemini response (in addition to Gemini's own `responseSchema` enforcement)
- On invalid JSON: ONE retry with explicit "your previous response was invalid, return strict JSON" instruction
- On second failure: serve last cached prediction from Postgres `ai_predictions` if any, otherwise surface error to user — NEVER fabricate

---

## 8. External APIs (free tier — user must provide keys)

| Service | Purpose | Free-tier limit | Env var |
|---|---|---|---|
| **Finnhub** | Quotes, profiles, news, recommendations, insiders, WebSocket | 60 calls/min | `FINNHUB_API_KEY` |
| **Alpha Vantage** | Technical indicators, historical (backup) | 25 calls/day, 5/min | `ALPHA_VANTAGE_API_KEY` |
| **Twelve Data** | Real-time prices (backup) | 800 calls/day, 8/min | `TWELVE_DATA_API_KEY` |
| **Financial Modeling Prep** | Extended fundamentals | 250 calls/day | `FMP_API_KEY` |
| **Marketaux** | News + sentiment | 100 calls/day | `MARKETAUX_API_KEY` |
| **Google Gemini** | AI forecasts and explanations | Per usage | `GEMINI_API_KEY` (model: `GEMINI_MODEL`, default `gemini-2.5-flash`) |
| **Supabase** | Auth + Postgres | 500MB DB, 50k MAU | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Upstash Redis** | Cache + rate limiting | 10k commands/day | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

**Company logos:** Finnhub returns `logo` in `/stock/profile2`. Backup: Clearbit Logo API (`https://logo.clearbit.com/{domain}`) — no key, free.

**Rate-limit strategy:**
- Finnhub is primary for everything it supports (quotes, profiles, news, recommendations, insiders, candles)
- Alpha Vantage / Twelve Data are fallbacks when Finnhub is rate-limited
- FMP fills in extra fundamentals (DCF, advanced ratios) on demand
- Marketaux supplements news sentiment when Finnhub news is thin

**⚠️ Sensitive credential rule:** Before pulling production OAuth secrets or paid-tier keys, pause and confirm with the user. Free-tier API keys are fine to request directly.

---

## 9. Database Schema (Postgres / Supabase)

The full schema lives in `db/schema.sql`. Run it once against the Supabase project before first start. Summary of tables:

- `profiles` — user profile + disclaimer acknowledgment
- `watchlists` — named watchlists per user
- `watchlist_items` — symbols in a watchlist
- `portfolios` — named portfolios per user
- `portfolio_positions` — manual position entries with cost basis
- `price_alerts` — threshold-based notifications
- `ai_predictions` — cached forecasts keyed by symbol + expiry
- `stock_metadata` — cached company profile + logo per symbol

Row-Level Security is enabled on every user-scoped table with policy `using (auth.uid() = user_id)`.

---

## 10. Caching Strategy

| Data type | TTL | Storage |
|---|---|---|
| Real-time quote snapshot | 15 sec | Redis |
| WebSocket quote stream | live | direct stream |
| Company profile + logo | 7 days | Redis + Postgres |
| Fundamentals | 24 hours | Redis |
| Technical indicators | 1 hour | Redis |
| Per-symbol news | 30 min | Redis |
| Analyst recommendations | 24 hours | Redis |
| Insider transactions | 6 hours | Redis |
| AI forecast | 12 hours | Redis + Postgres |
| Market indices | 1 min | Redis |
| Search autocomplete results | 15 min | Redis |

Cache key format: `{type}:{symbol}:{params_hash}` (e.g., `quote:AAPL`, `indicators:AAPL:rsi-14`, `news:AAPL:30d`).

Implementation: a thin `cache(key, ttl, fetcher)` wrapper in `lib/cache.ts` — every external fetch goes through it.

---

## 11. Security & Rate-Limiting

- All API keys live in `.env.local` — server-only access
- Per-external-API server-side queue with rate limit + exponential backoff retries
- Per-user rate limit (Upstash Ratelimit): **100 req/min** general, **10 AI-refresh/hour**
- Supabase RLS on every `user_id`-scoped table
- CSRF: SameSite=Lax cookies + origin check on mutating routes
- Content Security Policy headers in `next.config.ts`
- **Zod** input validation on every API route
- No PII in logs; scrub user IDs and emails from error reports
- All forms run client-side validation via Zod + react-hook-form, but server-side validation is the source of truth

---

## 12. UI Design (shadcn/ui + sanctioned companions)

> shadcn/ui components are generated locally into [components/ui/](./components/ui/) — we own the source and can edit them freely. Built on `@base-ui/react` primitives (note: `asChild` is NOT supported; trigger components use `render` props, or use controlled `open` state with regular `Button` instead). Use the standard `cn(...)` helper from [lib/utils.ts](./lib/utils.ts) for class composition.

### Layout
- App shell in [app/(app)/layout.tsx](./app/(app)/layout.tsx): collapsible `AppSidebar` (nav grouped into Overview / Your money / Research, config in `components/layout/nav-items.ts`), a blurred top bar with the ⌘K `GlobalSearch` command palette (stocks, investors, pages), the live `MarketStatus` pill (Finnhub `/stock/market-status`, 60s cache) and the Simple/Technical `UxToggle`. On phones the sidebar becomes a sheet opened from the `MobileTabBar` bottom navigation.
- `AppFooter` renders the §15 disclaimer at the end of every app page.
- Content uses `Card` containers inside `PageContainer` / `PageHeader`. Shared building blocks: `FilterChip` / `ChipRow` / `Segmented` ([components/ui/filter-chip.tsx](./components/ui/filter-chip.tsx)) for filters and ranges, `EmptyState` for zero-data and error states, and `AICard` / `AIBadge` / `ConfidenceMeter` / `ForecastRangeBar` ([components/ui/ai-card.tsx](./components/ui/ai-card.tsx)) for every AI surface.

### Stock detail page
- Header row inside a `Card`: logo `<img>` + name + sector `Badge` + price (`<span className="tabular-nums">`) + custom `ChangeBadge` (green / red percentage pill)
- Sections stream in via React `Suspense` with `Skeleton` fallbacks: PriceChart → Indicators → Forecast → Analyst/Insider grid → News
- **Price chart inside a `Card`** — TradingView Lightweight Charts (OHLC/candlestick + volume + indicator overlays)
- Key metrics rendered as a grid of small `Card`s (P/E, market cap, dividend yield, 52w high/low, etc.)
- Fundamentals trends (revenue, EPS, margin over 5y) — **Recharts** `<LineChart>` / `<AreaChart>` in a `Card`
- AI forecast section: `Card` with three sub-`Card`s (1w/1m/3m), a CSS-only progress bar for confidence, narrative paragraph, factor pills via `Badge`/`ChangeBadge`, plus the mandatory "AI estimate — not advice" `Badge`
- News list: one row per article with sentiment `Badge` (success / muted / destructive); optional sentiment-over-time Recharts `<AreaChart>` above the list
- Insiders / Analysts: plain `<table>` with sortable columns + filterable buy/sell

### Comparison page
- Multi-select up to 4 tickers via an inline `StockSearch`-style input; selected tickers shown as `Badge`s with a remove `Button`
- Overlay line chart in a `Card` — Recharts `<LineChart>` with prices normalized to 0% at start (TradingView Lightweight Charts is OHLC-only; comparison uses Recharts)
- `<table>` for side-by-side metrics with colored ticker headers

### Watchlist page
- One row per stock: logo, symbol, name, price, `ChangeBadge`, remove `Button`
- Empty state: centered `Card` with "Add your first stock" `Button` linking to `/stocks/AAPL`
- CSV export link to `/api/export/watchlist`

### Portfolio page
- `Card` grid for KPIs: total cost, total value, total P/L, today's P/L (with `ChangeBadge` chips)
- Allocation **Recharts** `<PieChart>` (`AllocationPie` component) inside a `Card`
- `<table>` for positions with quantity, cost basis, current value, P/L absolute + %
- `AddPositionForm` server-action form + `DeletePositionButton` per row

### Alerts UI
- `Dialog` (controlled `open` state — `asChild` on triggers is not supported by `@base-ui/react`) opened from the stock page for creating an alert
- Alerts list as `Card`-per-row with active/triggered status `Badge`
- Triggered alerts surface on the stock detail page in a banner `Card`

### Loading & error states
- `Skeleton` inside every `Suspense` boundary while data loads
- `Sonner` toasts for transient notifications (price alerts, errors, "added to watchlist") — `<Toaster />` mounted once in the app layout
- Error boundary fallback: `Card` with a retry `Button`

### Theming
- **Dark mode only.** No light theme, no toggle, no system-preference detection. Do not install `next-themes`. `data-theme="dark"` + `class="dark"` are hardcoded on `<html>` in [app/layout.tsx](./app/layout.tsx).
- **Tailwind v4 dark variant override:** [app/globals.css](./app/globals.css) declares `@custom-variant dark (&:where(.dark, .dark *));` so `dark:` keys off our `.dark` class, not `prefers-color-scheme`. Removing this line silently breaks every dark-mode color in the app.
- **Brand accent: the shadcn "Purple" preset** — applied via `npx shadcn@latest apply --preset b4P7eq8m8`. We override the dark-mode `--primary` to the brighter `oklch(0.627 0.265 303.9)` ≈ `#ad46ff` (instead of the preset's default deep `oklch(0.438 0.218 303.724)` which renders nearly-black on dark surfaces). Buttons use `variant="default"` (which reads `--primary`). The purple accent applies to:
  - Default `Button`s, links, focus rings
  - Active nav item
  - Brand logo
  - AI-related highlights (forecast confidence bar, "AI estimate" badge, AI Insights card accent)
  - Chart series accents when no semantic up/down meaning applies (single-series sparklines)
- **Semantic colors (separate from the accent — do NOT replace with purple):**
  - "Up" / positive change: `emerald-400` text + `emerald-500/10` bg + `ring-emerald-500/20`
  - "Down" / negative change: `rose-400` text + `rose-500/10` bg + `ring-rose-500/20`
  - Both encoded in [components/ui/change-badge.tsx](./components/ui/change-badge.tsx) — never inline these classes elsewhere; import `ChangeBadge` (pill), `ChangeText` (inline "+$2.31 (+1.24%)" next to large figures) or the `directionText` / `directionBg` helpers.
- Background palette: `--background` `#0a0a0c` (near-black) / `--card` `#131316` / `--border` white at 8%. Surface elevation via the lighter card background plus a 1px top highlight (`surface-highlight` utility), not via heavy borders. AI surfaces add the `ai-glow` utility (soft brand-purple radial wash).
- Data density: tabular numbers (`tabular-nums`) on all price, percentage, and metric values for proper alignment.
- Formatting: all currency / compact-number / percent formatting MUST go through [lib/format.ts](./lib/format.ts) (`usd`, `compactUsd`, `compactNum`, `pct`). Do not define new `Intl.NumberFormat` instances at call sites.

---

## 13. Implementation Status

Phase 1 (MVP) is complete: auth, stock search + detail page, AI forecast
pipeline, watchlists, and price alerts. Later phases added the dashboard,
stock comparison, news + sentiment, analyst/insider tabs, and a portfolio
tracker. See the git history for the per-feature build order.

---

## 14. Quality & Testing

- **TypeScript strict mode** + **ESLint** (next + import-order) + **Prettier**
- **Zod** for: external API response validation, route handler input validation, AI JSON output validation
- **Vitest** unit tests for: AI prompt builder, cache wrapper, P/L calculator, sentiment aggregation
- **Playwright** e2e tests for critical paths: signup, add to watchlist, view forecast, set alert
- **Error boundaries** at React route-segment level (`app/(route)/error.tsx`)
- **Sentry** for production errors
- **Pre-commit hook** (husky + lint-staged): lint + typecheck on staged files
- All external API responses wrapped in try/catch with cache fallback
- **NO mock data** — every endpoint hits real APIs; loading/empty/error states cover the gaps

---

## 15. Legal Disclaimers (REQUIRED in UI)

- **Footer on every page:** *"Verdex provides informational analysis powered by artificial intelligence. This is NOT financial advice. Predictions are probabilistic and may be wrong. Past performance does not indicate future results. Always do your own research and consult a licensed financial advisor before investing."*
- **First-run modal** on signup with required acknowledgment checkbox; persist to `profiles.disclaimer_acked_at`
- **Badge on every AI forecast card:** "AI estimate — not advice"
- **No trading capability** — the app is read/analyze only. Never integrate brokerage execution.

---

## 16. Pre-Development Checklist (provide before coding)

User must provide these before Phase 0:

1. **Free API keys** (register, ~5 min each):
   - Finnhub: https://finnhub.io
   - Alpha Vantage: https://www.alphavantage.co/support/#api-key
   - Twelve Data: https://twelvedata.com
   - Financial Modeling Prep: https://site.financialmodelingprep.com/developer
   - Marketaux: https://www.marketaux.com
2. **Supabase project** — supabase.com (URL + anon key + service role key)
3. **Upstash Redis** — upstash.com (REST URL + token)
4. **Google Gemini API key** — aistudio.google.com (`GEMINI_API_KEY`); default model `gemini-2.5-flash` via `GEMINI_MODEL` env

Fill `.env.local` from `.env.example` with all values before starting.

---

## 17. File & Folder Conventions

```
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (app)/dashboard/page.tsx
  (app)/stocks/[symbol]/page.tsx
  (app)/watchlist/page.tsx
  (app)/compare/page.tsx
  (app)/portfolio/page.tsx
  api/
    search/route.ts
    stocks/[symbol]/route.ts
    predict/[symbol]/route.ts
    news/[symbol]/route.ts
    watchlist/route.ts
    portfolio/route.ts
    alerts/route.ts
    compare/route.ts
    cron/prewarm-predictions/route.ts
  layout.tsx
  providers.tsx
lib/
  cache.ts            # Redis cache wrapper
  ratelimit.ts        # Upstash ratelimit
  format.ts           # usd / compactUsd / compactNum / pct — SINGLE source for all number formatting
  forecast.ts         # Gemini forecast pipeline (cache + retry + Postgres fallback)
  indicators.ts       # local technical indicator computation
  utils.ts            # cn() helper for shadcn class composition
  supabase/
    client.ts         # browser client
    server.ts         # server client
    admin.ts          # service-role client
  apis/
    gemini.ts         # Google GenAI SDK setup + prompt loader + responseSchema
    finnhub.ts
    alpha-vantage.ts
    twelve-data.ts
    fmp.ts
    marketaux.ts
components/
  ui/                 # shadcn-generated primitives — owned in-repo; edit freely but keep the cn() conventions
  stock/              # ForecastSection, PriceChartSection, NewsSection, etc. + their *Skeleton siblings
  watchlist/
  portfolio/
  compare/
  alerts/
  auth/
  search/
db/
  schema.sql
prompts/
  forecast-system.md
```

Stick to this layout. New files belong inside an existing folder unless a new category is genuinely required.

---

**End of spec.**
