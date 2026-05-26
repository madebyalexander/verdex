'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type SearchResult = {
  symbol: string
  displaySymbol: string
  description: string
  type: string
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 h-5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

export function StockSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setLoading(false)
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

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    const myReq = ++reqId.current

    const timer = setTimeout(async () => {
      if (!trimmed) {
        if (myReq === reqId.current) {
          setResults([])
          setLoading(false)
        }
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        )
        if (myReq !== reqId.current) return
        if (res.ok) {
          const data = await res.json()
          const all: SearchResult[] = data.result ?? []
          const primary = all.filter(
            (r) => r.type === 'Common Stock' && !r.symbol.includes('.')
          )
          const list = primary.length > 0 ? primary : all
          setResults(list.slice(0, 10))
          setActiveIndex(0)
        }
      } catch (err) {
        console.error('[StockSearch]', err)
      } finally {
        if (myReq === reqId.current) setLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [query, open])

  function select(symbol: string) {
    handleOpenChange(false)
    router.push(`/stocks/${symbol}`)
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      select(results[activeIndex].symbol)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 h-8 px-3 rounded-md text-sm text-muted-foreground border border-border bg-secondary hover:bg-secondary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Search stocks (⌘K)"
      >
        <Search aria-hidden className="size-3.5" />
        <span>Search stocks…</span>
        <span className="flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search stocks</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search aria-hidden className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search by ticker or company name…"
              autoFocus
              aria-label="Search ticker or company name"
              aria-autocomplete="list"
              aria-controls="stock-search-results"
              className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground"
            />
            {loading && (
              <span className="text-xs text-muted-foreground">Searching…</span>
            )}
            <Kbd>esc</Kbd>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 && !loading && query.trim() && (
              <p className="text-sm text-center py-8 text-muted-foreground">
                No matches for &ldquo;{query}&rdquo;.
              </p>
            )}
            {results.length === 0 && !query.trim() && (
              <p className="text-sm text-center py-8 text-muted-foreground">
                Start typing a ticker or company name.
              </p>
            )}
            <ul id="stock-search-results" role="listbox">
              {results.map((r, i) => (
                <li key={r.symbol} role="option" aria-selected={i === activeIndex}>
                  <button
                    onClick={() => select(r.symbol)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 flex items-center gap-3',
                      i === activeIndex && 'bg-secondary'
                    )}
                  >
                    <span
                      className={cn(
                        'font-semibold tabular-nums w-20 shrink-0',
                        i === activeIndex && 'text-primary'
                      )}
                    >
                      {r.displaySymbol}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {r.description}
                    </span>
                    <span className="text-xs shrink-0 text-muted-foreground">
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {results.length > 0 && (
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
              <span>Powered by Finnhub</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
