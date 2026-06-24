# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately via [GitHub's "Report a vulnerability"](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(Security tab → Report a vulnerability), or email **olexandr.design@gmail.com**.

Please include: a description, reproduction steps or a proof of concept, and the
affected route/component. We aim to acknowledge within 72 hours.

## Scope

In scope: authentication/session handling, Row-Level Security policies, API route
authorization, input validation, rate limiting, secret handling, and data export.

Out of scope: rate-limit thresholds tuned for the free tier, the documented
`script-src 'unsafe-inline'` CSP trade-off (tracked for nonce migration), and
issues requiring a compromised host or stolen credentials.

## Deployment hardening checklist

Before exposing an instance publicly:

- [ ] All required secrets set via the host's env (never committed). See `.env.example`.
- [ ] `db/schema.sql` applied — confirm **RLS is enabled** on every user table
      (`profiles`, `watchlists`, `watchlist_items`, `portfolios`,
      `portfolio_positions`, `price_alerts`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only and never reaches the client bundle.
- [ ] `CRON_SECRET` is a strong random value (`openssl rand -hex 32`).
- [ ] Security headers (CSP, HSTS, X-Frame-Options) served — verify `next.config.ts`.
- [ ] Rotate any key that may have been shared during development.

## Supported versions

Security fixes are applied to the latest `main`.
