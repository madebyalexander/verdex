'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  addToWatchlist,
  removeFromWatchlist,
} from '@/app/(app)/watchlist/actions'
import { IoStar as StarSolid, IoStarOutline as StarOutline } from 'react-icons/io5'

export function WatchlistToggleButton({
  symbol,
  initialIn,
  iconOnly = false,
}: {
  symbol: string
  initialIn: boolean
  /** Render as a borderless star toggle (used in the sticky stock hero) */
  iconOnly?: boolean
}) {
  const [isIn, setIsIn] = useState(initialIn)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const prev = isIn
    setIsIn(!prev)
    startTransition(async () => {
      const res = prev
        ? await removeFromWatchlist(symbol)
        : await addToWatchlist(symbol)
      if (res?.error) {
        setIsIn(prev)
        toast.error("Couldn't update watchlist", { description: res.error })
      } else {
        toast.success(
          prev
            ? `Removed ${symbol} from watchlist`
            : `Added ${symbol} to watchlist`
        )
      }
    })
  }

  const ariaLabel = isIn
    ? `Remove ${symbol} from watchlist`
    : `Add ${symbol} to watchlist`

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isIn}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {isIn ? (
          <StarSolid aria-hidden className="size-4 text-primary" />
        ) : (
          <StarOutline aria-hidden className="size-4 text-muted-foreground" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={isIn ? 'outline' : 'default'}
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isIn}
      aria-label={ariaLabel}
    >
      {isIn ? (
        <StarSolid aria-hidden className="size-3.5 text-primary" />
      ) : (
        <StarOutline aria-hidden className="size-3.5" />
      )}
      <span>{isIn ? 'Watchlisted' : 'Watchlist'}</span>
    </Button>
  )
}
