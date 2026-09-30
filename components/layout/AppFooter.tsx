/**
 * Required on every page (docs/ARCHITECTURE.md §15). Sits at the end of the
 * scroll container so it never competes with page content.
 */
export function AppFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-col gap-3 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p className="max-w-3xl">
          Verdex provides informational analysis powered by artificial
          intelligence. This is <strong className="font-medium text-foreground/80">NOT financial advice</strong>.
          Predictions are probabilistic and may be wrong. Past performance does
          not indicate future results. Always do your own research and consult
          a licensed financial advisor before investing.
        </p>
        <p className="text-muted-foreground/70">
          Market data: Finnhub · Alpha Vantage · SEC EDGAR. Forecasts: Google
          Gemini.
        </p>
      </div>
    </footer>
  )
}
