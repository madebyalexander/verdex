'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { refreshForecast } from '@/app/(app)/stocks/[symbol]/actions'
import { IoRefresh as Refresh } from 'react-icons/io5'

export function RefreshForecastButton({ symbol }: { symbol: string }) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const res = await refreshForecast(symbol)
      if (res?.error) {
        toast.error("Couldn't refresh forecast", { description: res.error })
      } else {
        toast.success(`Forecast regenerated for ${symbol}`)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label="Regenerate AI forecast"
    >
      <Refresh aria-hidden className={cn('size-3.5', pending && 'animate-spin')} />
      <span>{pending ? 'Regenerating…' : 'Refresh'}</span>
    </Button>
  )
}
