import Image from 'next/image'
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
          <Image
            src="/verdex-mark-white.svg"
            alt=""
            width={32}
            height={32}
            priority
            unoptimized
            className="h-8 w-8"
          />
          <span className="text-base font-semibold tracking-tight">
            Verdex
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-6">
        {children}
      </main>
      <footer className="px-6 py-5 text-xs text-center text-muted-foreground">
        <p className="max-w-xl mx-auto">
          Verdex provides informational analysis powered by artificial
          intelligence. This is NOT financial advice. Predictions are
          probabilistic and may be wrong. Always do your own research.
        </p>
      </footer>
    </div>
  )
}
