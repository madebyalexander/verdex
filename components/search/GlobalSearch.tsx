'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StockLogo } from '@/components/ui/stock-logo'
import { NAV_GROUPS, type NavItem } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'
import { matchInvestors } from '@/lib/investors'
import {
  IoSearch as Search,
  IoPeople as People,
  IoReturnDownBack as Enter,
} from 'react-icons/io5'

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

type PageItem = NavItem & { kind: 'page' }

type Item = StockItem | InvestorItem | PageItem

type FinnhubResult = {
  symbol: string
  displaySymbol: string
  description: string
  type: string
}

const PAGES: PageItem[] = NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ ...i, kind: 'page' as const }))
)

// Shortcuts shown before the user types — navigation only, no market values.
const POPULAR: StockItem[] = [
  ['AAPL', 'Apple Inc.'],
  ['NVDA', 'NVIDIA Corp.'],
  ['MSFT', 'Microsoft Corp.'],
  ['TSLA', 'Tesla, Inc.'],
  ['AMZN', 'Amazon.com, Inc.'],
  ['META', 'Meta Platforms, Inc.'],
].map(([symbol, description]) => ({
  kind: 'stock',
  symbol,
  display: symbol,
  description,
  type: 'Popular',
}))

function keyOf(item: Item): string {
  if (item.kind === 'stock') return `s:${item.symbol}`
  if (item.kind === 'investor') return `i:${item.cik}`
  return `p:${item.href}`
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/[0.06] px-1.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-white/[0.08]">
      {children}
    </kbd>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <li
      aria-hidden
      className="px-3 pt-3 pb-1.5 text-[11px] font-medium text-muted-foreground/80"
    >
      {children}
    </li>
  )
}

function StockSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="size-8 shrink-0 rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
            <div
              className="h-3 rounded bg-muted animate-pulse"
              style={{ width: `${70 - i * 10}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ResultRow({
  index,
  active,
  onSelect,
  onHover,
  children,
}: {
  index: number
  active: boolean
  onSelect: () => void
  onHover: (index: number) => void
  children: React.ReactNode
}) {
  return (
    <li role="option" aria-selected={active} data-index={index}>
      <button
        type="button"
        onClick={onSelect}
        onMouseMove={() => onHover(index)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
          active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
        )}
      >
        {children}
        <Enter
          aria-hidden
          className={cn(
            'ml-auto size-3.5 shrink-0 text-muted-foreground transition-opacity',
            active ? 'opacity-100' : 'opacity-0'
          )}
        />
      </button>
    </li>
  )
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const reqId = useRef(0)
  const listRef = useRef<HTMLUListElement>(null)

  const trimmed = query.trim()
  const hasQuery = trimmed.length > 0

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

  const pages = useMemo<PageItem[]>(() => {
    if (!hasQuery) return PAGES
    const q = trimmed.toLowerCase()
    return PAGES.filter((p) => p.label.toLowerCase().includes(q))
  }, [hasQuery, trimmed])

  const stockList = hasQuery ? stocks : POPULAR

  // One flat list drives keyboard navigation across every group.
  const flat = useMemo<Item[]>(
    () =>
      hasQuery
        ? [...stockList, ...investors, ...pages]
        : [...stockList, ...pages],
    [hasQuery, stockList, investors, pages]
  )
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

  // Keep the highlighted row in view while arrowing through long lists.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Debounced fetch — all setState kept inside setTimeout to satisfy
  // react-hooks/set-state-in-effect (no sync setState in effect body).
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    const myReq = ++reqId.current

    const timer = setTimeout(async () => {
      if (!q) {
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
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
    if (item.kind === 'stock') router.push(`/stocks/${item.symbol}`)
    else if (item.kind === 'investor') router.push(`/investors?cik=${item.cik}`)
    else router.push(item.href)
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

  const showEmpty = !stocksLoading && hasQuery && flat.length === 0

  function rowProps(item: Item) {
    const index = indexByKey.get(keyOf(item)) ?? 0
    return {
      index,
      active: index === activeIndex,
      onSelect: () => select(item),
      onHover: setActiveIndex,
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full items-center justify-between gap-2.5 rounded-full bg-white/[0.04] px-3.5 text-sm text-muted-foreground ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label="Search (⌘K)"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Search aria-hidden className="size-4 shrink-0" />
          <span className="truncate">Search stocks, investors, pages…</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search stocks, investors and pages</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <Search aria-hidden className="size-4 shrink-0 text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search ticker, company, investor or page…"
              autoFocus
              aria-label="Search ticker, company, investor or page"
              aria-autocomplete="list"
              aria-controls="global-search-results"
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            {stocksLoading && (
              <span
                aria-label="Searching"
                className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              />
            )}
            <Kbd>esc</Kbd>
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto p-2">
            {showEmpty && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{trimmed}&rdquo;. Try a ticker like
                &nbsp;<span className="font-medium text-foreground">NVDA</span>.
              </p>
            )}

            <ul id="global-search-results" role="listbox" ref={listRef}>
              {(stocksLoading || stockList.length > 0) && (
                <>
                  <SectionLabel>{hasQuery ? 'Stocks' : 'Popular stocks'}</SectionLabel>
                  {stocksLoading && <StockSkeleton />}
                  {stockList.map((item) => (
                    <ResultRow key={keyOf(item)} {...rowProps(item)}>
                      <StockLogo
                        symbol={item.symbol}
                        className="size-8 rounded-lg text-xs"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold tabular-nums">
                          {item.display}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </ResultRow>
                  ))}
                </>
              )}

              {hasQuery && investors.length > 0 && (
                <>
                  <SectionLabel>Investors</SectionLabel>
                  {investors.map((item) => (
                    <ResultRow key={keyOf(item)} {...rowProps(item)}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-muted-foreground">
                        <People aria-hidden className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {item.person}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.firm} · 13F filer
                        </span>
                      </span>
                    </ResultRow>
                  ))}
                </>
              )}

              {pages.length > 0 && (
                <>
                  <SectionLabel>Jump to</SectionLabel>
                  {pages.map((item) => (
                    <ResultRow key={keyOf(item)} {...rowProps(item)}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-muted-foreground">
                        <item.icon aria-hidden className="size-4" />
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </ResultRow>
                  ))}
                </>
              )}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
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
            <span className="hidden sm:inline">Stocks · Finnhub &nbsp;·&nbsp; Investors · SEC</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
