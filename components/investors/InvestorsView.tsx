'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  INVESTORS,
  INVESTOR_CATEGORIES,
  CATEGORY_LABEL,
  investorByCik,
  type Investor,
  type InvestorCategory,
} from '@/lib/investors'
import type { Fund13F, HoldingMove, MoveAction } from '@/lib/apis/sec'
import { TradeBars } from '@/components/investors/TradeBars'
import { cn } from '@/lib/utils'
import { compactUsd } from '@/lib/format'
import {
  IoChevronDown as ChevronDown,
  IoChevronBack as ChevronLeft,
  IoChevronForward as ChevronRight,
} from 'react-icons/io5'

const CATEGORY_BADGE: Record<InvestorCategory, string> = {
  value: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  growth: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
  activist: 'bg-primary/10 text-primary ring-primary/25',
  macro: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  quant: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
}

type SortKey = 'featured' | 'name' | 'firm'

const SORT_LABEL: Record<SortKey, string> = {
  featured: 'Featured',
  name: 'Name',
  firm: 'Firm',
}

function compactShares(n: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function InvestorsView() {
  const router = useRouter()
  const cikParam = useSearchParams().get('cik')
  // The URL is the single source of truth for the selected fund, so deep-links
  // from the global search palette (`/investors?cik=…`) just work.
  const active: Investor = (cikParam && investorByCik(cikParam)) || INVESTORS[0]
  const [fund, setFund] = useState<Fund13F | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [category, setCategory] = useState<InvestorCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('featured')
  const cacheRef = useRef<Map<string, Fund13F>>(new Map())
  const reqId = useRef(0)
  const stripRef = useRef<HTMLDivElement>(null)
  const activeChipRef = useRef<HTMLButtonElement>(null)
  const [arrows, setArrows] = useState({ left: false, right: false })

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const i of INVESTORS) m[i.category] = (m[i.category] ?? 0) + 1
    return m
  }, [])

  const shown = useMemo(() => {
    const list =
      category === 'all'
        ? INVESTORS
        : INVESTORS.filter((i) => i.category === category)
    if (sortBy === 'featured') return list // curated order — selected fund first
    return [...list].sort((a, b) =>
      sortBy === 'name'
        ? a.person.localeCompare(b.person)
        : a.firm.localeCompare(b.firm)
    )
  }, [category, sortBy])

  useEffect(() => {
    const myReq = ++reqId.current
    const cached = cacheRef.current.get(active.cik)
    if (cached) {
      setFund(cached)
      setState('ready')
      return
    }
    setState('loading')
    fetch(`/api/investors?cik=${active.cik}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { fund: Fund13F }) => {
        if (myReq !== reqId.current) return
        cacheRef.current.set(active.cik, data.fund)
        setFund(data.fund)
        setState('ready')
      })
      .catch(() => {
        if (myReq === reqId.current) setState('error')
      })
  }, [active])

  // Show/hide the scroll arrows based on the strip's overflow + position.
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const update = () => {
      setArrows({
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      })
    }
    const raf = requestAnimationFrame(update)
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [shown])

  function nudge(dir: -1 | 1) {
    stripRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  // Keep the selected investor visible (e.g. deep-links land mid-list).
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [active, shown])

  return (
    <div className="flex flex-col gap-8">
      {/* Filter + sort bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          active={category === 'all'}
          count={INVESTORS.length}
          onClick={() => setCategory('all')}
        >
          All
        </FilterPill>
        {INVESTOR_CATEGORIES.map((c) => (
          <FilterPill
            key={c.id}
            active={category === c.id}
            count={counts[c.id] ?? 0}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </FilterPill>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            Sort: {SORT_LABEL[sortBy]}
            <ChevronDown aria-hidden className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('featured')}>
              Featured
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              Name (A–Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('firm')}>
              Firm (A–Z)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Investor strip — single row, horizontally scrollable with arrows */}
      <div className="relative">
        {arrows.left && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-background to-transparent"
          />
        )}
        {arrows.right && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-background to-transparent"
          />
        )}
        {arrows.left && (
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Scroll investors left"
            className="absolute left-0 top-1/2 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
        )}
        {arrows.right && (
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Scroll investors right"
            className="absolute right-0 top-1/2 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        )}

        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((inv) => {
            const isActive = inv.id === active.id
            return (
              <button
                key={inv.id}
                ref={isActive ? activeChipRef : null}
                type="button"
                onClick={() => router.replace(`/investors?cik=${inv.cik}`, { scroll: false })}
                aria-pressed={isActive}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl py-2 pl-2 pr-3 ring-1 ring-inset transition-colors text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-primary/10 text-primary ring-primary/30'
                    : 'bg-secondary text-foreground ring-border hover:bg-secondary/70'
                )}
              >
                <InvestorAvatar investor={inv} className="size-9" />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="whitespace-nowrap text-sm font-semibold leading-tight">
                    {inv.person}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'whitespace-nowrap text-[11px] leading-tight',
                        isActive ? 'text-primary/80' : 'text-muted-foreground'
                      )}
                    >
                      {inv.firm}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                        CATEGORY_BADGE[inv.category]
                      )}
                    >
                      {CATEGORY_LABEL[inv.category]}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <InvestorPortrait active={active} fund={fund} state={state} />
    </div>
  )
}

function initials(person: string): string {
  return person
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function InvestorAvatar({
  investor,
  className,
}: {
  investor: Investor
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!investor.photo || failed) {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset',
          CATEGORY_BADGE[investor.category],
          className
        )}
      >
        {initials(investor.person)}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full bg-secondary',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={investor.photo}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </span>
  )
}

function FilterPill({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active
          ? 'bg-primary/15 text-primary ring-primary/30'
          : 'bg-secondary text-muted-foreground ring-border hover:bg-secondary/70 hover:text-foreground'
      )}
    >
      {children}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  )
}

function InvestorPortrait({
  active,
  fund,
  state,
}: {
  active: Investor
  fund: Fund13F | null
  state: 'loading' | 'ready' | 'error'
}) {
  const isReady = state === 'ready' && fund != null
  const buyCount = isReady
    ? fund!.notableMoves.filter(
        (m) => m.action === 'new' || m.action === 'added'
      ).length
    : null
  const sellCount = isReady
    ? fund!.notableMoves.filter(
        (m) => m.action === 'reduced' || m.action === 'exited'
      ).length
    : null
  const holdingsCount = isReady ? fund!.topHoldings.length : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{active.firm}</CardTitle>
        <CardDescription>
          {active.person} · {active.blurb}
          {isReady && (
            <>
              {' · '}
              {compactUsd(fund!.totalValue)} across {fund!.holdingsCount}{' '}
              positions
              {fund!.reportDate && ` · as of ${fund!.reportDate}`}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === 'error' ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this fund&apos;s latest 13F filing from SEC. Try
            another investor.
          </p>
        ) : !isReady ? (
          <PortraitSkeleton />
        ) : (
          <Tabs defaultValue="buys">
            <TabsList className="self-start">
              <TabsTrigger value="buys">
                Buys
                <TabCount value={buyCount} tone="bullish" />
              </TabsTrigger>
              <TabsTrigger value="sells">
                Sells
                <TabCount value={sellCount} tone="bearish" />
              </TabsTrigger>
              <TabsTrigger value="holdings">
                Holdings
                <TabCount value={holdingsCount} tone="neutral" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buys">
              <TradeBars moves={fund!.notableMoves} kind="buy" />
            </TabsContent>
            <TabsContent value="sells">
              <TradeBars moves={fund!.notableMoves} kind="sell" />
            </TabsContent>
            <TabsContent value="holdings">
              <MovesList moves={fund!.topHoldings} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function TabCount({
  value,
  tone,
}: {
  value: number | null
  tone: 'bullish' | 'bearish' | 'neutral'
}) {
  if (value == null) return null
  return (
    <span
      className={cn(
        'ml-1.5 inline-flex items-center h-4 px-1.5 rounded-full text-[10px] font-semibold tabular-nums ring-1 ring-inset',
        tone === 'bullish' &&
          'bg-emerald-500/12 text-emerald-400 ring-emerald-500/25',
        tone === 'bearish' && 'bg-rose-500/12 text-rose-400 ring-rose-500/25',
        tone === 'neutral' && 'bg-muted text-muted-foreground ring-border'
      )}
    >
      {value}
    </span>
  )
}

function MovesList({ moves }: { moves: HoldingMove[] }) {
  if (moves.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing to show.
      </p>
    )
  }
  return (
    <ul className="divide-y divide-border -mx-6">
      {moves.map((m) => (
        <li
          key={m.cusip}
          className="flex items-center gap-3 px-4 sm:px-6 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {titleCase(m.issuer)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {m.action === 'exited'
                ? `was ${compactShares(m.prevShares)} shares`
                : `${compactShares(m.shares)} shares`}
            </p>
          </div>

          <ActionBadge action={m.action} />

          <div className="w-[84px] text-right text-sm tabular-nums shrink-0">
            {m.action === 'exited' ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              compactUsd(m.value)
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function ActionBadge({ action }: { action: MoveAction }) {
  const map: Record<MoveAction, { label: string; cls: string }> = {
    new: {
      label: 'New buy',
      cls: 'bg-emerald-500/12 text-emerald-400 ring-emerald-500/25',
    },
    added: {
      label: 'Added',
      cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    },
    reduced: {
      label: 'Reduced',
      cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
    },
    exited: {
      label: 'Exited',
      cls: 'bg-rose-500/12 text-rose-400 ring-rose-500/25',
    },
    held: {
      label: 'Held',
      cls: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/25',
    },
  }
  const { label, cls } = map[action]
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ring-1 ring-inset shrink-0',
        cls
      )}
    >
      {label}
    </span>
  )
}

function PortraitSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex items-center gap-1 h-8 px-[3px] rounded-2xl bg-muted self-start">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[26px] w-20 rounded-xl bg-foreground/5 animate-pulse"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-7 rounded-full bg-muted animate-pulse"
            style={{ width: `${110 + (i % 4) * 22}px` }}
          />
        ))}
      </div>
    </div>
  )
}

/** 13F issuer names come in ALL CAPS — make them readable. */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Llc|Ltd|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m.toUpperCase())
}
