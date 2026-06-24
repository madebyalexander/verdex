'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { matchInvestors } from '@/lib/investors'
import { IoSearch as Search, IoPeople as People } from 'react-icons/io5'

type StockItem = {
  kind: 'stock'
  symbol: string
  display: string
  description: string
  type: string
}

type InvestorItem = {
  kind: 'investor'
  cik: string
  person: string
  firm: string
}

type Item = StockItem | InvestorItem

type FinnhubResult = {
  symbol: string
  displaySymbol: string
  description: string
  type: string
}

function keyOf(item: Item): string {
  return item.kind === 'stock' ? `s:${item.symbol}` : `i:${item.cik}`
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 h-5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <li
      aria-hidden
      className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </li>
  )
}

function StockSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="px-4 py-2.5 flex items-center gap-3">
          <div className="h-4 w-20 rounded bg-muted animate-pulse shrink-0" />
          <div
            className="h-4 rounded bg-muted animate-pulse flex-1"
            style={{ maxWidth: `${80 - i * 8}%` }}
          />
          <div className="h-3 w-16 rounded bg-muted animate-pulse shrink-0" />
        </li>
      ))}
    </ul>
  )
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)

  // Investors are a tiny static list — match instantly, no network.
  const investors = useMemo<InvestorItem[]>(
    () =>
      matchInvestors(query).map((i) => ({
        kind: 'investor',
        cik: i.cik,
        person: i.person,
        firm: i.firm,
      })),
    [query]
  )

  // Stocks first (primary), then investors. Flat list drives keyboard nav.
  const flat = useMemo<Item[]>(() => [...stocks, ...investors], [stocks, investors])
  const indexByKey = useMemo(() => {
    const m = new Map<string, number>()
    flat.forEach((it, i) => m.set(keyOf(it), i))
    return m
  }, [flat])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setStocks([])
      setActiveIndex(0)
      setStocksLoading(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Debounced fetch — all setState kept inside setTimeout to satisfy
  // react-hooks/set-state-in-effect (no sync setState in effect body).
  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    const myReq = ++reqId.current

    const timer = setTimeout(async () => {
      if (!trimmed) {
        if (myReq === reqId.current) {
          setStocks([])
          setStocksLoading(false)
          setActiveIndex(0)
        }
        return
      }

      setStocksLoading(true)
      setStocks([])
      setActiveIndex(0)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (myReq !== reqId.current) return
        if (res.ok) {
          const data = await res.json()
          const all: FinnhubResult[] = data.result ?? []
          const primary = all.filter(
            (r) => r.type === 'Common Stock' && !r.symbol.includes('.')
          )
          const list = primary.length > 0 ? primary : all
          setStocks(
            list.slice(0, 8).map((r) => ({
              kind: 'stock',
              symbol: r.symbol,
              display: r.displaySymbol,
              description: r.description,
              type: r.type,
            }))
          )
        }
      } catch (err) {
        console.error('[GlobalSearch]', err)
      } finally {
        if (myReq === reqId.current) setStocksLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [query, open])

  function select(item: Item) {
    handleOpenChange(false)
    if (item.kind === 'stock') {
      router.push(`/stocks/${item.symbol}`)
    } else {
      router.push(`/investors?cik=${item.cik}`)
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault()
      select(flat[activeIndex])
    }
  }

  const hasQuery = query.trim().length > 0
  const showEmpty = !stocksLoading && hasQuery && flat.length === 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2.5 h-8 px-3.5 rounded-[500px] text-sm text-muted-foreground border border-border bg-secondary hover:bg-secondary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Search (⌘K)"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Search aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">Search stocks &amp; investors…</span>
        </span>
        <span className="hidden sm:flex items-center gap-1 shrink-0">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search stocks and investors</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search aria-hidden className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search ticker, company, or investor…"
              autoFocus
              aria-label="Search ticker, company, or investor"
              aria-autocomplete="list"
              aria-controls="global-search-results"
              className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground"
            />
            {stocksLoading && (
              <span className="text-xs text-muted-foreground">Searching…</span>
            )}
            <Kbd>esc</Kbd>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {showEmpty && (
              <p className="text-sm text-center py-8 text-muted-foreground">
                No matches for &ldquo;{query}&rdquo;.
              </p>
            )}
            {!hasQuery && (
              <p className="text-sm text-center py-8 text-muted-foreground">
                Search for a stock ticker, company, or investor.
              </p>
            )}

            <ul id="global-search-results" role="listbox">
              {(stocksLoading || stocks.length > 0) && (
                <>
                  <SectionLabel>Stocks</SectionLabel>
                  {stocksLoading && <StockSkeleton />}
                  {stocks.map((item) => {
                    const idx = indexByKey.get(keyOf(item)) ?? 0
                    return (
                      <li
                        key={keyOf(item)}
                        role="option"
                        aria-selected={idx === activeIndex}
                      >
                        <button
                          onClick={() => select(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 flex items-center gap-3',
                            idx === activeIndex && 'bg-secondary'
                          )}
                        >
                          <span
                            className={cn(
                              'font-semibold tabular-nums w-20 shrink-0',
                              idx === activeIndex && 'text-primary'
                            )}
                          >
                            {item.display}
                          </span>
                          <span className="flex-1 text-sm truncate">
                            {item.description}
                          </span>
                          <span className="text-xs shrink-0 text-muted-foreground">
                            {item.type}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </>
              )}

              {investors.length > 0 && (
                <>
                  <SectionLabel>Investors</SectionLabel>
                  {investors.map((item) => {
                    const idx = indexByKey.get(keyOf(item)) ?? 0
                    return (
                      <li
                        key={keyOf(item)}
                        role="option"
                        aria-selected={idx === activeIndex}
                      >
                        <button
                          onClick={() => select(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 flex items-center gap-3',
                            idx === activeIndex && 'bg-secondary'
                          )}
                        >
                          <span
                            className={cn(
                              'flex items-center justify-center size-8 rounded-full bg-muted shrink-0',
                              idx === activeIndex && 'text-primary'
                            )}
                          >
                            <People aria-hidden className="size-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">
                              {item.person}
                            </span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {item.firm}
                            </span>
                          </span>
                          <span className="text-xs shrink-0 text-muted-foreground">
                            13F fund
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </>
              )}
            </ul>
          </div>

          {flat.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 text-xs border-t border-border text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  <span>open</span>
                </span>
              </span>
              <span>Stocks · Finnhub &nbsp;·&nbsp; Investors · SEC</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
