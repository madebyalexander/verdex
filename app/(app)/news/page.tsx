import { Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SymbolBadge } from '@/components/ui/symbol-badge'
import { listWatchlistItems } from '@/lib/watchlist'
import {
  getCompanyNews,
  type FinnhubNewsArticle,
} from '@/lib/apis/finnhub'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const POPULAR = [
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'TSLA',
  'META',
  'AMZN',
  'NFLX',
]

type EnrichedArticle = FinnhubNewsArticle & {
  symbols: string[]
}

export default async function NewsPage() {
  const watchlistItems = await listWatchlistItems()
  const watchlistSymbols = watchlistItems.map((i) => i.symbol)
  const watchlistSet = new Set(watchlistSymbols)
  const symbols = Array.from(new Set([...watchlistSymbols, ...POPULAR]))

  const perSymbol = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const articles = await getCompanyNews(sym, 7)
        return { symbol: sym, articles }
      } catch {
        return { symbol: sym, articles: [] as FinnhubNewsArticle[] }
      }
    })
  )

  const byId = new Map<number, EnrichedArticle>()
  for (const { symbol, articles } of perSymbol) {
    for (const a of articles) {
      const existing = byId.get(a.id)
      if (existing) {
        if (!existing.symbols.includes(symbol)) existing.symbols.push(symbol)
      } else {
        byId.set(a.id, { ...a, symbols: [symbol] })
      }
    }
  }

  const all = Array.from(byId.values()).sort(
    (a, b) => b.datetime - a.datetime
  )
  const visible = all.slice(0, 100)

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon={Newspaper}
        title="Market news"
        description={`Last 7 days across your watchlist + popular tickers · ${visible.length} of ${all.length} articles`}
      />

      {visible.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-sm text-muted-foreground">
            No recent news to show.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <ul>
              {visible.map((article, i) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isLast={i === visible.length - 1}
                  watchlistSet={watchlistSet}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function ArticleRow({
  article,
  isLast,
  watchlistSet,
}: {
  article: EnrichedArticle
  isLast: boolean
  watchlistSet: Set<string>
}) {
  const d = new Date(article.datetime * 1000)
  const dateLabel = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const timeLabel = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <li className={cn('py-3', !isLast && 'border-b border-border')}>
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="block group"
      >
        <p className="text-sm font-medium leading-snug group-hover:underline underline-offset-2">
          {article.headline}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mt-1.5 text-muted-foreground">
          {article.source && (
            <span className="truncate max-w-[10rem]">{article.source}</span>
          )}
          <span className="tabular-nums whitespace-nowrap">
            {dateLabel} · {timeLabel}
          </span>
          {article.category && (
            <span className="truncate">{article.category}</span>
          )}
        </div>
      </a>
      {article.symbols.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
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
    </li>
  )
}
