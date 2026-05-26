import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center justify-center px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-5 w-5 rounded-md bg-primary"
          />
          <span className="text-base font-semibold tracking-tight">
            StockSense AI
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-6">
        {children}
      </main>
      <footer className="px-6 py-5 text-xs text-center text-muted-foreground">
        <p className="max-w-xl mx-auto">
          StockSense AI provides informational analysis powered by artificial
          intelligence. This is NOT financial advice. Predictions are
          probabilistic and may be wrong. Always do your own research.
        </p>
      </footer>
    </div>
  )
}
