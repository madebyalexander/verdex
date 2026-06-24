'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { SymbolBadge } from '@/components/ui/symbol-badge'
import { SymbolCombobox } from '@/components/search/SymbolCombobox'

const SymbolRegex = /^[A-Z][A-Z0-9.-]{0,9}$/

const POPULAR_PAIRS: string[][] = [
  ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
  ['NVDA', 'AMD', 'INTC'],
  ['TSLA', 'RIVN', 'LCID'],
  ['META', 'GOOGL', 'SNAP'],
  ['NFLX', 'DIS'],
  ['JPM', 'BAC', 'WFC', 'GS'],
  ['KO', 'PEP'],
  ['V', 'MA'],
]

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((s) => b.includes(s))

export function CompareControls({
  symbols,
  max,
}: {
  symbols: string[]
  max: number
}) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function navigate(next: string[]) {
    const params = new URLSearchParams()
    if (next.length > 0) params.set('symbols', next.join(','))
    const url = next.length > 0 ? `/compare?${params.toString()}` : '/compare'
    startTransition(() => router.push(url))
  }

  function addSymbol(raw: string) {
    setError(null)
    const sym = raw.trim().toUpperCase()
    if (!SymbolRegex.test(sym)) {
      setError('Symbol must be 1–10 uppercase chars')
      return
    }
    if (symbols.includes(sym)) {
      setError(`${sym} already added`)
      return
    }
    if (symbols.length >= max) {
      setError(`Max ${max} symbols`)
      return
    }
    navigate([...symbols, sym])
    setInput('')
  }

  function remove(sym: string) {
    navigate(symbols.filter((s) => s !== sym))
  }

  const full = symbols.length >= max

  return (
    <div className="flex flex-col gap-3">
      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {symbols.map((s) => (
            <SymbolBadge
              key={s}
              symbol={s}
              active
              onRemove={pending ? undefined : () => remove(s)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <SymbolCombobox
            value={input}
            onChange={setInput}
            onSelect={(symbol) => addSymbol(symbol)}
            placeholder={
              full ? `Max ${max} symbols` : 'Add a symbol (e.g. NVDA)'
            }
            disabled={full || pending}
            excludeSymbols={symbols}
            ariaLabel="Add a stock to compare"
          />
        </div>
        <Button
          onClick={() => addSymbol(input)}
          disabled={!input.trim() || full || pending}
        >
          Add
        </Button>
      </div>

      {error && (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Popular comparisons</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PAIRS.map((pair) => {
            const trimmed = pair.slice(0, max)
            const active = sameSet(trimmed, symbols)
            return (
              <Button
                key={trimmed.join(',')}
                type="button"
                variant={active ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setError(null)
                  setInput('')
                  navigate(trimmed)
                }}
                disabled={pending || active}
                aria-label={`Compare ${trimmed.join(', ')}`}
                className="font-mono text-xs"
              >
                {trimmed.join(' · ')}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
