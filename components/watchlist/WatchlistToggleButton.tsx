'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  addToWatchlist,
  removeFromWatchlist,
} from '@/app/(app)/watchlist/actions'

export function WatchlistToggleButton({
  symbol,
  initialIn,
}: {
  symbol: string
  initialIn: boolean
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

  return (
    <Button
      variant={isIn ? 'outline' : 'default'}
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isIn}
      aria-label={isIn ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
    >
      <Star
        aria-hidden
        className={cn(
          'size-3.5 transition-colors',
          isIn && 'fill-current text-primary'
        )}
      />
      <span>{isIn ? 'Watchlisted' : 'Watchlist'}</span>
    </Button>
  )
}
