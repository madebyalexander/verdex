'use client'

import { useState, useTransition } from 'react'
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
import { toast } from 'sonner'
import { addPosition } from '@/app/(app)/portfolio/actions'

export function AddPositionForm() {
  const today = new Date().toISOString().slice(0, 10)
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [openedAt, setOpenedAt] = useState(today)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setSymbol('')
    setQuantity('')
    setCostBasis('')
    setError(null)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add position</CardTitle>
        <CardDescription>
          Manual entry — cost basis is per share at time of purchase.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
            placeholder="180.50"
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
      </CardContent>
      {error && (
        <div className="px-6 pb-2 text-sm text-rose-400" role="alert">
          {error}
        </div>
      )}
      <CardFooter>
        <Button
          onClick={submit}
          disabled={!symbol || !quantity || !costBasis || pending}
        >
          {pending ? 'Adding…' : 'Add position'}
        </Button>
      </CardFooter>
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
        className="text-xs uppercase tracking-wide font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
