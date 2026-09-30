'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { SymbolBadge } from '@/components/ui/symbol-badge'
import { FilterChip } from '@/components/ui/filter-chip'
import type { FinnhubNewsArticle } from '@/lib/apis/finnhub'
import type { Sentiment } from '@/lib/news-sentiment'
import { cn } from '@/lib/utils'
import {
  IoArrowUp as ArrowUp,
  IoArrowDown as ArrowDown,
  IoRemove as Dot,
  IoStar as Star,
  IoFlame as Flame,
} from 'react-icons/io5'

export type FeedArticle = FinnhubNewsArticle & {
  symbols: string[]
  sentiment: Sentiment
}

const SENTIMENT_META: Record<
  Sentiment,
  { label: string; text: string; bar: string; accent: string; Icon: typeof ArrowUp }
> = {
  positive: {
    label: 'Bullish',
    text: 'text-emerald-400',
    bar: 'bg-emerald-400',
    accent: 'border-l-emerald-400/70',
    Icon: ArrowUp,
  },
  negative: {
    label: 'Bearish',
    text: 'text-rose-400',
    bar: 'bg-rose-400',
    accent: 'border-l-rose-400/70',
    Icon: ArrowDown,
  },
  neutral: {
    label: 'Neutral',
    text: 'text-muted-foreground',
    bar: 'bg-muted-foreground/40',
    accent: 'border-l-transparent',
    Icon: Dot,
  },
}

function timeAgo(unixSec: number): string {
  const diff = Date.now() / 1000 - unixSec
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

function groupByDay(items: FeedArticle[]): { label: string; items: FeedArticle[] }[] {
  const buckets: Record<string, FeedArticle[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  }
  const now = new Date()
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  for (const a of items) {
    const t = a.datetime * 1000
    const label =
      t >= startToday
        ? 'Today'
        : t >= startToday - 86_400_000
          ? 'Yesterday'
          : 'Earlier'
    buckets[label].push(a)
  }
  return (['Today', 'Yesterday', 'Earlier'] as const)
    .filter((l) => buckets[l].length > 0)
    .map((l) => ({ label: l, items: buckets[l] }))
}

function NewsThumb({ src, className }: { src?: string; className: string }) {
  const [ok, setOk] = useState(true)
  if (!src || !ok) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setOk(false)}
      className={className}
    />
  )
}

function SentimentMark({ sentiment }: { sentiment: Sentiment }) {
  const m = SENTIMENT_META[sentiment]
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', m.text)}
      title={m.label}
    >
      <m.Icon aria-hidden className="size-3" />
    </span>
  )
}

export function NewsFeed({
  articles,
  watchlist,
}: {
  articles: FeedArticle[]
  watchlist: string[]
}) {
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist])
  const [filter, setFilter] = useState<'all' | Sentiment>('all')
  const [ticker, setTicker] = useState<string>('all')
  const [watchlistOnly, setWatchlistOnly] = useState(false)

  const counts = useMemo(() => {
    const c = { positive: 0, negative: 0, neutral: 0 }
    for (const a of articles) c[a.sentiment]++
    return c
  }, [articles])

  // Tickers present in the feed, most-mentioned first.
  const tickers = useMemo(() => {
    const freq = new Map<string, number>()
    for (const a of articles)
      for (const s of a.symbols) freq.set(s, (freq.get(s) ?? 0) + 1)
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([s]) => s)
  }, [articles])

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        if (filter !== 'all' && a.sentiment !== filter) return false
        if (ticker !== 'all' && !a.symbols.includes(ticker)) return false
        if (watchlistOnly && !a.symbols.some((s) => watchlistSet.has(s)))
          return false
        return true
      }),
    [articles, filter, ticker, watchlistOnly, watchlistSet]
  )

  // Hero only on the default (unfiltered) view; otherwise group everything.
  const noFilters = filter === 'all' && ticker === 'all' && !watchlistOnly
  const featured = noFilters ? filtered[0] : undefined
  const listItems = noFilters ? filtered.slice(1) : filtered
  const groups = useMemo(() => groupByDay(listItems), [listItems])
  const total = articles.length

  const mood =
    counts.positive > counts.negative * 1.2
      ? { text: 'Leans bullish', cls: 'text-emerald-400' }
      : counts.negative > counts.positive * 1.2
        ? { text: 'Leans bearish', cls: 'text-rose-400' }
        : { text: 'Mixed', cls: 'text-muted-foreground' }

  const topTickers = tickers.slice(0, 10)
  const tickerCount = (t: string) => articles.filter((a) => a.symbols.includes(t)).length

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:order-2">
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">Market mood</span>
              <span className={cn('text-sm font-semibold', mood.cls)}>{mood.text}</span>
            </div>
            <div
              role="img"
              aria-label={`${counts.positive} bullish, ${counts.negative} bearish, ${counts.neutral} neutral headlines`}
              className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.05]"
            >
              {(['positive', 'neutral', 'negative'] as Sentiment[]).map((s) =>
                counts[s] > 0 ? (
                  <div
                    key={s}
                    className={cn('first:rounded-l-full last:rounded-r-full', SENTIMENT_META[s].bar)}
                    style={{ width: `${(counts[s] / total) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {total} headlines over the last 7 days
            </p>
            <div className="flex flex-wrap gap-1.5">
              <MoodPill active={filter === 'all'} onClick={() => setFilter('all')}>
                All <span className="tabular-nums opacity-70">{total}</span>
              </MoodPill>
              {(['positive', 'negative', 'neutral'] as Sentiment[]).map((s) => {
                const m = SENTIMENT_META[s]
                return (
                  <MoodPill key={s} active={filter === s} onClick={() => setFilter(s)}>
                    <m.Icon aria-hidden className={cn('size-3', m.text)} />
                    {m.label}
                    <span className="tabular-nums opacity-70">{counts[s]}</span>
                  </MoodPill>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {(topTickers.length > 0 || watchlist.length > 0) && (
          <Card size="sm">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Most mentioned</span>
                {watchlist.length > 0 && (
                  <MoodPill active={watchlistOnly} onClick={() => setWatchlistOnly((v) => !v)}>
                    <Star aria-hidden className="size-3" />
                    My watchlist
                  </MoodPill>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topTickers.map((t) => (
                  <MoodPill
                    key={t}
                    active={ticker === t}
                    onClick={() => setTicker(ticker === t ? 'all' : t)}
                  >
                    {t}
                    <span className="tabular-nums opacity-60">{tickerCount(t)}</span>
                  </MoodPill>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="hidden text-xs text-muted-foreground lg:block">
          Sentiment is estimated from headlines — not investment advice.
        </p>
      </aside>

      <div className="flex min-w-0 flex-col gap-4 lg:order-1 lg:col-span-2">
        {!noFilters && (
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {total} headlines
            </span>
            <button
              type="button"
              onClick={() => {
                setFilter('all')
                setTicker('all')
                setWatchlistOnly(false)
              }}
              className="font-medium text-primary hover:text-primary/80"
            >
              Clear filters
            </button>
          </div>
        )}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No headlines match these filters.
            </CardContent>
          </Card>
        ) : (
          <>
            {featured && (
              <FeaturedStory article={featured} watchlistSet={watchlistSet} />
            )}
            <Card variant="list" className="gap-0 py-0">
              {groups.map((g) => (
                <section key={g.label}>
                  <h3 className="border-b border-border bg-white/[0.015] px-5 py-2 text-xs font-medium text-muted-foreground">
                    {g.label}
                  </h3>
                  <ul className="divide-y divide-border">
                    {g.items.map((a) => (
                      <li key={a.id}>
                        <ArticleRow article={a} watchlistSet={watchlistSet} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </Card>
          </>
        )}
        <p className="text-xs text-muted-foreground lg:hidden">
          Sentiment is estimated from headlines — not investment advice.
        </p>
      </div>
    </div>
  )
}

function MoodPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <FilterChip active={active} onClick={onClick} className="h-7 px-3">
      {children}
    </FilterChip>
  )
}

function FeaturedStory({
  article,
  watchlistSet,
}: {
  article: FeedArticle
  watchlistSet: Set<string>
}) {
  const m = SENTIMENT_META[article.sentiment]
  return (
    <Card className="overflow-hidden py-0 bg-gradient-to-br from-primary/[0.08] via-card to-card ring-primary/20">
      <CardContent className="flex flex-col gap-4 py-5">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Flame aria-hidden className="size-3" />
            Top story
          </span>
          {article.source && (
            <span className="truncate max-w-[12rem] text-muted-foreground">
              {article.source}
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums text-muted-foreground">
            {timeAgo(article.datetime)}
          </span>
          <span
            className={cn('ml-auto inline-flex items-center gap-1 font-medium', m.text)}
          >
            <m.Icon aria-hidden className="size-3" />
            {m.label}
          </span>
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="group flex gap-4 focus-visible:outline-none"
        >
          <NewsThumb
            src={article.image}
            className="hidden h-28 w-44 shrink-0 rounded-xl object-cover sm:block"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="text-lg font-semibold leading-snug group-hover:underline underline-offset-2">
              {article.headline}
            </h3>
            {article.summary && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {article.summary}
              </p>
            )}
          </div>
        </a>

        {article.symbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.symbols.map((s) => (
              <SymbolBadge
                key={s}
                symbol={s}
                size="sm"
                href={`/stocks/${s}`}
                active={watchlistSet.has(s)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ArticleRow({
  article,
  watchlistSet,
}: {
  article: FeedArticle
  watchlistSet: Set<string>
}) {
  const m = SENTIMENT_META[article.sentiment]
  return (
    <div className={cn('flex gap-3 border-l-2 px-5 py-3 transition-colors hover:bg-white/[0.02]', m.accent)}>
      <div className="min-w-0 flex-1">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:underline"
          title={article.summary || undefined}
        >
          {article.headline}
        </a>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <SentimentMark sentiment={article.sentiment} />
          {article.source && <span className="max-w-[10rem] truncate">{article.source}</span>}
          <span aria-hidden>·</span>
          <span className="whitespace-nowrap tabular-nums">{timeAgo(article.datetime)}</span>
          {article.symbols.length > 0 && <span aria-hidden>·</span>}
          {article.symbols.map((s) => (
            <Link
              key={s}
              href={`/stocks/${s}`}
              className={cn(
                'font-semibold tabular-nums transition-colors hover:text-primary',
                watchlistSet.has(s) ? 'text-primary' : 'text-foreground/80'
              )}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
      <NewsThumb
        src={article.image}
        className="h-14 w-20 shrink-0 rounded-lg object-cover"
      />
    </div>
  )
}
