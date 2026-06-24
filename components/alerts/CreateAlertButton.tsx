'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceQuickPicks } from '@/components/ui/price-quick-picks'
import { toast } from 'sonner'
import { createAlert } from '@/app/(app)/alerts/actions'
import { IoNotifications as Bell, IoNotificationsCircle as AppNotification } from 'react-icons/io5'

export function CreateAlertButton({
  symbol,
  currentPrice,
  iconOnly = false,
}: {
  symbol: string
  currentPrice: number
  /** Render as a borderless bell icon (used in the sticky stock hero) */
  iconOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setCondition('above')
    setPrice('')
    setError(null)
  }

  function submit() {
    setError(null)
    const target = parseFloat(price)
    if (!Number.isFinite(target) || target <= 0) {
      setError('Enter a positive number')
      return
    }
    startTransition(async () => {
      const res = await createAlert({
        symbol,
        condition,
        target_price: target,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      toast.success(`Alert set: ${symbol} ${condition} $${target.toFixed(2)}`)
      setOpen(false)
      reset()
    })
  }

  const triggerLabel = `Set price alert for ${symbol}`

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label={triggerLabel}
          title={triggerLabel}
        >
          <Bell aria-hidden className="size-4 text-muted-foreground" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={triggerLabel}
        >
          <AppNotification aria-hidden className="size-3.5" />
          <span>Set alert</span>
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) reset()
        }}
      >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <Bell aria-hidden className="size-4" />
            <span>Price alert for {symbol}</span>
          </DialogTitle>
          <DialogDescription>
            Currently ${currentPrice.toFixed(2)}. Notify me when the price
            goes:
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              variant={condition === 'above' ? 'default' : 'outline'}
              onClick={() => setCondition('above')}
              disabled={pending}
              className="flex-1"
            >
              Above
            </Button>
            <Button
              variant={condition === 'below' ? 'default' : 'outline'}
              onClick={() => setCondition('below')}
              disabled={pending}
              className="flex-1"
            >
              Below
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="target-price" className="text-sm font-medium">
              Target price ($)
            </label>
            <Input
              id="target-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={`e.g. ${(currentPrice * (condition === 'above' ? 1.05 : 0.95)).toFixed(2)}`}
              step="0.01"
              min="0"
            />
            <PriceQuickPicks
              currentPrice={currentPrice}
              direction={condition}
              value={price}
              onPick={setPrice}
              disabled={pending}
            />
          </div>
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!price || pending}>
            {pending ? 'Saving…' : 'Save alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
