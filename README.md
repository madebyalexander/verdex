# Verdex

[![CI](https://github.com/madebyalexander/verdex/actions/workflows/ci.yml/badge.svg)](https://github.com/madebyalexander/verdex/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

AI-powered stock forecasting for retail investors. Verdex synthesizes technical
indicators, fundamentals, news sentiment, analyst ratings, and insider activity
into **probabilistic price forecasts** across three horizons (1 week, 1 month,
3 months) — each with transparent, conviction-weighted reasoning.

> ⚠️ **Not financial advice.** Verdex provides informational analysis powered by
> artificial intelligence. Forecasts are probabilistic and may be wrong. Past
> performance does not indicate future results. Always do your own research and
> consult a licensed financial advisor before investing.

## Features

- **AI forecasts** — Gemini-generated 1w/1m/3m price targets with confidence
  levels, bull/bear factor breakdowns, and evidence.
- **Dashboard "Top Pick"** — the most actionable call, ranked by
  conviction-weighted expected move across all cached forecasts.
- **Watchlists & price alerts** — track symbols and get threshold alerts.
- **Portfolio** — positions with P/L and allocation breakdown.
- **CSV export** — watchlist and portfolio (formula-injection-safe).
- **Dark, modern UI** — shadcn/ui on Tailwind v4, purple brand accent.

## Screenshots

<!-- Add screenshots to docs/screenshots/ and reference them here, e.g.:
![Dashboard](docs/screenshots/dashboard.png)
![Stock detail with AI forecast](docs/screenshots/forecast.png)
-->

_Screenshots coming soon — run locally (see below) to preview the dashboard,
stock detail page with AI forecast, and watchlist._

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · shadcn/ui
(`@base-ui/react` + Tailwind v4) · Supabase (Postgres + Auth + RLS) ·
Upstash Redis (cache + rate limiting) · Google Gemini (`@google/genai`) ·
TanStack Query · Zustand · Recharts + TradingView Lightweight Charts.

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Upstash Redis](https://upstash.com) database
- API keys: Google Gemini, Finnhub, and the other market-data providers below

### 1. Install

```bash
npm install        # repo uses legacy-peer-deps (.npmrc)
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. Vars prefixed `NEXT_PUBLIC_` are exposed to
the browser — keep all secrets (service-role key, API keys, `CRON_SECRET`)
unprefixed. See `.env.example` for the full annotated list.

### 3. Set up the database

Run [`db/schema.sql`](./db/schema.sql) once in the Supabase SQL Editor. This
creates all tables **and enables Row-Level Security** scoped to `auth.uid()`.
Confirm RLS is enabled on every user table in the Supabase dashboard before
exposing the app publicly.

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite |
| `npm run test:coverage` | Tests with coverage |

A Husky pre-commit hook runs `lint-staged` + the test suite.

## Architecture notes

- **API keys are server-only.** Every external service is proxied through
  `app/api/*` route handlers — no third-party SDK with a secret key is ever
  imported into a client component.
- **Everything is cached.** External calls go through Upstash Redis with TTLs
  per [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) §10; routes are rate-limited per user/IP.
- **No mock data.** Every displayed value comes from a real API; loading and
  error states are surfaced instead of placeholders.
- **Dark mode only.** Hardcoded via `data-theme="dark"` — there is no light
  theme or theme toggle.

Project conventions live in [`CLAUDE.md`](./CLAUDE.md); the full product and
implementation reference is in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Security

Found a vulnerability? See [`SECURITY.md`](./SECURITY.md) for private disclosure
and the pre-deployment hardening checklist. **Do not** open a public issue for
security reports.

## License

[MIT](./LICENSE) © Alexander
