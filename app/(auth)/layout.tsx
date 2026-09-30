import Image from 'next/image'
import Link from 'next/link'
import {
  IoSparkles as Sparks,
  IoAnalytics as Chart,
  IoLayers as Layers,
} from 'react-icons/io5'

const FEATURES = [
  {
    icon: Sparks,
    title: 'Forecasts you can audit',
    body: '1-week, 1-month and 3-month ranges with the weighted factors behind every call.',
  },
  {
    icon: Chart,
    title: 'All the research in one place',
    body: 'Live quotes, candlesticks, indicators, analyst ratings, insider trades and news sentiment.',
  },
  {
    icon: Layers,
    title: 'Built around your portfolio',
    body: 'Watchlists, price alerts, live P/L and side-by-side comparisons.',
  },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary inset-shadow-[0_1px_0_rgb(255_255_255/0.2)]">
        <Image
          src="/verdex-mark-white.svg"
          alt=""
          width={20}
          height={20}
          priority
          unoptimized
          className="size-5"
        />
      </span>
      <span className="text-lg font-semibold tracking-tight">Verdex</span>
    </Link>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#070709] p-12 lg:flex">
        {/* Decorative only: faint grid and an abstract trend line. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
        />
        <svg
          aria-hidden
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-primary"
        >
          <path
            d="M0 170 C 60 160, 90 120, 150 130 S 250 90, 300 100 S 390 40, 450 60 S 540 20, 600 10 L 600 200 L 0 200 Z"
            fill="currentColor"
            fillOpacity="0.07"
          />
          <path
            d="M0 170 C 60 160, 90 120, 150 130 S 250 90, 300 100 S 390 40, 450 60 S 540 20, 600 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative">
          <Brand />
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/30">
              <Sparks aria-hidden className="size-3" />
              AI-powered stock research
            </span>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
              Invest with clarity,
              <br />
              <span className="text-primary">not guesswork.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Verdex turns market data into transparent AI forecasts — so you
              see why a stock might move, not just a number.
            </p>
          </div>
          <ul className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary ring-1 ring-inset ring-white/[0.08]">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/70">
            Research tool only — Verdex never places trades.
          </p>
        </div>

        {/* Bottom band is left to the decorative trend line. */}
        <div aria-hidden className="h-20" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-center px-6 py-6 lg:hidden">
          <Brand />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-8">
          {children}
        </main>
        <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
          <p className="mx-auto max-w-xl leading-relaxed">
            Verdex provides informational analysis powered by artificial
            intelligence. This is NOT financial advice. Predictions are
            probabilistic and may be wrong. Past performance does not indicate
            future results. Always do your own research and consult a licensed
            financial advisor before investing.
          </p>
        </footer>
      </div>
    </div>
  )
}
