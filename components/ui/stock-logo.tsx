'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Company logo in a fixed tile. Tries the provider logo (`src`, e.g. Finnhub's
 * profile logo) first, then FMP's public ticker image CDN, then a letter tile —
 * so a dead or missing URL never shows a broken-image icon.
 *
 * `light` puts the image on a white tile: most company marks are drawn for
 * light backgrounds and disappear on dark surfaces at larger sizes.
 *
 * `className` controls the tile size + rounding + (for the fallback) text
 * size, e.g. `className="size-7 rounded-md text-[11px]"`.
 */
export function StockLogo({
  symbol,
  src,
  light = false,
  className,
}: {
  symbol: string
  src?: string | null
  light?: boolean
  className?: string
}) {
  const sources = [
    src || null,
    `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`,
  ].filter((s): s is string => !!s)
  const [attempt, setAttempt] = useState(0)

  if (attempt >= sources.length) {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-flex shrink-0 items-center justify-center bg-secondary font-semibold uppercase text-foreground/80',
          className
        )}
      >
        {symbol.slice(0, 1)}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden',
        light ? 'bg-white' : 'bg-secondary',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={sources[attempt]}
        src={sources[attempt]}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setAttempt((a) => a + 1)}
        className="size-full object-contain p-[15%]"
      />
    </span>
  )
}
