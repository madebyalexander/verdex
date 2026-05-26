# StockSense AI — Project Rules

> AI-powered stock forecasting web app. Full spec: [SPEC.md](./SPEC.md).
> This file is auto-loaded by Claude Code on every session. Keep it tight.

## Non-negotiable rules

1. **UI library: shadcn/ui as the primary source.** Every UI element should come from the local `components/ui/*` (shadcn/ui generated, built on `@base-ui/react` primitives + Tailwind v4) when an equivalent component exists. Sanctioned companions: `lucide-react` for icons, `recharts` for line/area/bar/pie/composed charts, `lightweight-charts` (TradingView) for OHLC/candlestick + volume + indicator overlays, `sonner` for toasts. Do NOT pull in another full UI library (no Material UI, Chakra, HeroUI, Tremor, etc.).

   **Charting:** shadcn/ui does not ship a chart library — use `recharts` for everything except candlesticks. For stock **price charts with OHLC/candlestick + volume + technical indicator overlays**, use **TradingView Lightweight Charts** wrapped inside a `Card` — Recharts isn't built for candlesticks.

   **Adding components:** When you need a new shadcn primitive (e.g. `tabs`, `tooltip`), run `pnpm dlx shadcn@latest add <name>` (or the equivalent `npx` command — the project uses `legacy-peer-deps=true`) and verify the generated file lands in [components/ui/](./components/ui/). Never invent prop names — check the generated file or `@base-ui/react` types.

   **Visual identity — non-negotiable:**
   - **Dark mode ONLY.** No light theme, no system-preference fallback, no theme toggle anywhere in the UI. Do not install `next-themes` or any other theme switcher. Dark mode is hardcoded via `data-theme="dark"` + `class="dark"` on `<html>` in [app/layout.tsx](./app/layout.tsx).
   - **Tailwind v4 dark variant:** Tailwind v4 ties `dark:` to `prefers-color-scheme` by default. We override with `@custom-variant dark (&:where(.dark, .dark *));` in [app/globals.css](./app/globals.css) so `dark:` keys off our hardcoded `.dark` class. Do not remove that custom variant.
   - **Brand accent: purple `#9353D3`.** Mapped to shadcn's `--primary` CSS variable in [app/globals.css](./app/globals.css). Buttons use `variant="default"` (which reads `--primary`); apply the purple accent for: primary buttons, links, focus rings, AI-related highlights (forecast badges, AI insights), active nav item, brand logo.
   - **Semantic colors for stock direction stay separate:** `emerald-*` (green) for "up" / `rose-*` (red) for "down" on price changes, chart fills, and P/L — see [components/ui/change-badge.tsx](./components/ui/change-badge.tsx). Do NOT replace these with purple — they are functional, not decorative.
   - **Font: Inter only.** All font CSS variables (`--font-sans`, `--font-mono`, `--font-heading`) point at the Inter Next/font variable. Do not add additional Google Fonts without explicit user approval.

2. **NO mock data, ever.** Every value shown to the user (prices, logos, news, forecasts, metrics, recommendations) must come from a real external API. While loading or on failure, show proper `Skeleton` / empty-state / error states. If a required API key is missing in `.env.local`, fail loudly with a clear server log — never silently fall back to fake values.

3. **API keys are server-only.** Use Next.js Route Handlers (`app/api/*`) as proxies for every external service. Never import a third-party SDK with a secret key from a client component. Verify no secret leaks into the client bundle.

4. **Cache aggressively.** Free-tier APIs have tight rate limits. Every external call must go through Upstash Redis with the TTL specified in SPEC.md §10. A cache miss on a hot path is a bug, not a normal state.

5. **Validate every boundary.** Use Zod schemas for: every external API response (incoming), every Route Handler input (from client), every AI JSON output. On invalid AI JSON → one retry → fallback to last cached prediction → surface error to user.

6. **AI forecasts are probabilistic, not advice.** Every forecast card must display the "AI estimate — not advice" badge. Every page footer must show the financial disclaimer (SPEC.md §15). First-run modal must capture acknowledgment into `profiles.disclaimer_acked_at`.

7. **Tech stack is fixed** (SPEC.md §3): Next.js 16 App Router, React 19, TypeScript strict, **shadcn/ui** (`@base-ui/react` + Tailwind v4 + `class-variance-authority`), Supabase, Upstash Redis, **Google Gemini** (`@google/genai`), TanStack Query, Zustand. Charts: `recharts` (line/area/bar/pie/composed) + TradingView Lightweight Charts (OHLC/candlestick only). Toasts: `sonner`. Do not swap any of these without explicit user approval.

## Setup checklist

Before any feature work:

1. Verify the user has filled `.env.local` from `.env.example` (see SPEC.md §16).
2. Run `db/schema.sql` against the Supabase project (SQL editor or `supabase db push`).
3. Confirm shadcn/ui + Tailwind v4 are wired correctly — `npm run build` succeeds and the dashboard renders in dark mode with the purple accent.

If any of these are missing, stop and ask the user before scaffolding features.

## Build order (Phase 1 MVP)

Follow strictly. Mark each item complete only after it works end-to-end in the browser with REAL APIs.

1. Project scaffold: Next.js + TS + Tailwind v4 + shadcn/ui wired with dark theme hardcoded + purple `#9353D3` accent (`--primary` override). ✅ Done.
2. Supabase client + auth flow (email + Google OAuth) + `profiles` row creation on signup. ✅ Done.
3. `/api/search?q=` proxying Finnhub `symbol_lookup` via Redis cache (15 min TTL). ✅ Done.
4. `/api/stocks/[symbol]` returning quote + profile + logo, cached per SPEC §10. ✅ Done.
5. Stock detail page: header, chart (TradingView Lightweight Charts), key metrics grid — all in `Card`s with `Skeleton` loading states. ✅ Done.
6. `/api/predict/[symbol]` calling Gemini with the prompt in `prompts/forecast-system.md`, validated via Zod, cached 12h in Redis + Postgres. ✅ Done.
7. AI forecast section on detail page: three sub-cards (1w/1m/3m), confidence bar, narrative, factor chips. ✅ Done.
8. Watchlist: add/remove button on detail page, list view on `/watchlist`. ✅ Done.

Do not start Phase 2 work without explicit approval; Phase 1 is complete.

## Gemini SDK usage

- Default model: `gemini-2.5-flash` (env: `GEMINI_MODEL`).
- SDK: `@google/genai` — instantiated server-side only in [lib/apis/gemini.ts](./lib/apis/gemini.ts).
- System prompt: load from [prompts/forecast-system.md](./prompts/forecast-system.md).
- Use Gemini's `responseSchema` for structured JSON output — do not parse free-form text. Reject and retry once on Zod validation failure, then fall back to the most recent cached `ai_predictions` row.
- Cache key namespace: `forecast:gemini:${symbol}` (Redis) + `ai_predictions` table (Postgres). 12-hour TTL per SPEC §10.

## Verification policy

For every change touching the UI, the dev server must be started and the change observed in the browser (by the user, not by Claude — see "What to AVOID" below). Type checks and tests are not sufficient — visual and behavior verification is required.

For every change touching an API route, hit the route with a real request (curl or browser network tab) and confirm the response shape matches the Zod schema.

## What to AVOID

- Do NOT install additional UI libraries "just for one component" — generate it via `shadcn add` or hand-roll the piece you need. Sanctioned additions only: `recharts`, `lucide-react`, `lightweight-charts`, `sonner`.
- Do NOT add abstraction layers (custom `useFetch` hooks, repository patterns, etc.) until at least three call sites need them.
- Do NOT generate code comments explaining what well-named code already does.
- Do NOT skip rate limiting on routes that hit external APIs — abuse will burn through free tiers in minutes.
- Do NOT commit `.env.local` or any file containing real keys.
- Do NOT start the Next.js dev server from the Claude Bash environment — it has caused repeated macOS memory pressure and forced reboots. The user runs `npm run dev` themselves; Claude verifies via `npm run build` and `npm run typecheck` only.
