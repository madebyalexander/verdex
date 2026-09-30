'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SymbolCombobox } from '@/components/search/SymbolCombobox'
import { PriceQuickPicks } from '@/components/ui/price-quick-picks'
import { toast } from 'sonner'
import { addPosition } from '@/app/(app)/portfolio/actions'

const SymbolRegex = /^[A-Z][A-Z0-9.-]{0,9}$/

export function AddPositionForm() {
  const today = new Date().toISOString().slice(0, 10)
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [openedAt, setOpenedAt] = useState(today)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [priceState, setPriceState] = useState<
    'idle' | 'loading' | 'ready' | 'unavailable'
  >('idle')
  const quoteReqId = useRef(0)

  // Fetch the live quote for the typed symbol so the cost-basis quick-picks
  // can offer "Use current $X.XX ±N%" when opening a position today.
  useEffect(() => {
    const trimmed = symbol.trim().toUpperCase()
    const myReq = ++quoteReqId.current
    const isValid = SymbolRegex.test(trimmed)

    const timer = setTimeout(async () => {
      if (myReq !== quoteReqId.current) return
      if (!isValid) {
        setLivePrice(null)
        setPriceState('idle')
        return
      }
      setPriceState('loading')
      try {
        const res = await fetch(
          `/api/stocks/${encodeURIComponent(trimmed)}`,
          { cache: 'no-store' }
        )
        if (myReq !== quoteReqId.current) return
        if (!res.ok) {
          setLivePrice(null)
          setPriceState('unavailable')
          return
        }
        const data = await res.json()
        const c = typeof data?.quote?.c === 'number' ? data.quote.c : null
        if (c && c > 0) {
          setLivePrice(c)
          setPriceState('ready')
        } else {
          setLivePrice(null)
          setPriceState('unavailable')
        }
      } catch {
        if (myReq === quoteReqId.current) {
          setLivePrice(null)
          setPriceState('unavailable')
        }
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [symbol])

  function reset() {
    setSymbol('')
    setQuantity('')
    setCostBasis('')
    setError(null)
    setLivePrice(null)
    setPriceState('idle')
  }

  function submit() {
    setError(null)
    const q = parseFloat(quantity)
    const c = parseFloat(costBasis)
    if (!Number.isFinite(q) || q <= 0) {
      setError('Quantity must be a positive number')
      return
    }
    if (!Number.isFinite(c) || c < 0) {
      setError('Cost basis must be ≥ 0')
      return
    }
    startTransition(async () => {
      const res = await addPosition({
        symbol,
        quantity: q,
        cost_basis: c,
        opened_at: openedAt,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      toast.success(`Added ${q} ${symbol} @ $${c.toFixed(2)}`)
      reset()
    })
  }

  const isToday = openedAt === today
  const showPriceStrip = priceState !== 'idle'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add position</CardTitle>
        <CardDescription>
          Manual entry — cost basis is per share at time of purchase.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="contents"
      >
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Field id="pos-symbol" label="Symbol">
            <SymbolCombobox
              id="pos-symbol"
              value={symbol}
              onChange={(v) => setSymbol(v.toUpperCase())}
              onSelect={(picked) => setSymbol(picked.toUpperCase())}
              placeholder="AAPL"
              disabled={pending}
              ariaLabel="Stock symbol"
            />
          </Field>
          <Field id="pos-qty" label="Quantity">
            <Input
              id="pos-qty"
              type="number"
              step="0.0001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              disabled={pending}
            />
          </Field>
          <Field id="pos-cost" label="Cost basis ($/share)">
            <Input
              id="pos-cost"
              type="number"
              step="0.01"
              min="0"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder={livePrice ? livePrice.toFixed(2) : '180.50'}
              disabled={pending}
            />
          </Field>
          <Field id="pos-date" label="Opened">
            <Input
              id="pos-date"
              type="date"
              value={openedAt}
              max={today}
              onChange={(e) => setOpenedAt(e.target.value)}
              disabled={pending}
            />
          </Field>
        </div>

        {showPriceStrip && (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">
                {priceState === 'loading' && 'Fetching live price…'}
                {priceState === 'unavailable' &&
                  `Couldn't fetch a live price for ${symbol.trim().toUpperCase()}`}
                {priceState === 'ready' && livePrice && (
                  <>
                    Set cost basis from current{' '}
                    <span className="text-foreground tabular-nums">
                      ${livePrice.toFixed(2)}
                    </span>
                  </>
                )}
              </span>
              {priceState === 'ready' && livePrice && !isToday && (
                <span className="text-xs text-muted-foreground italic">
                  Switch &ldquo;Opened&rdquo; to today to use these shortcuts
                </span>
              )}
            </div>
            {priceState === 'ready' && livePrice && isToday && (
              <PriceQuickPicks
                currentPrice={livePrice}
                direction="both"
                value={costBasis}
                onPick={setCostBasis}
                disabled={pending}
              />
            )}
          </div>
        )}
      </CardContent>
      {error && (
        <div className="px-5 text-sm text-rose-400" role="alert">
          {error}
        </div>
      )}
      <CardFooter>
        <Button
          type="submit"
          size="lg"
          disabled={!symbol || !quantity || !costBasis || pending}
        >
          {pending ? 'Adding…' : 'Add position'}
        </Button>
      </CardFooter>
      </form>
    </Card>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
