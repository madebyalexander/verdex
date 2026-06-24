'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Square company logo resolved by ticker from FMP's public image CDN.
 * The logo image sits inside a fixed tile (consistent size + dark surface)
 * with `object-contain` + small padding so logos of varying aspect ratio
 * and internal whitespace all render in an identical frame.
 *
 * Falls back to a letter tile if the logo 404s or fails to load.
 *
 * `className` controls the tile size + rounding + (for the fallback) text
 * size, e.g. `className="size-7 rounded-md text-[11px]"`.
 */
export function StockLogo({
  symbol,
  className,
}: {
  symbol: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = `https://financialmodelingprep.com/image-stock/${encodeURIComponent(
    symbol
  )}.png`

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center justify-center shrink-0 bg-secondary text-foreground/80 font-semibold uppercase',
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
        'inline-flex items-center justify-center shrink-0 overflow-hidden bg-secondary',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-contain p-[15%]"
      />
    </span>
  )
}
