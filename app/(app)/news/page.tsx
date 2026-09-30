import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { listWatchlistItems } from '@/lib/watchlist'
import {
  getCompanyNews,
  type FinnhubNewsArticle,
} from '@/lib/apis/finnhub'
import { classifyNewsSentiment } from '@/lib/news-sentiment'
import { NewsFeed, type FeedArticle } from '@/components/news/NewsFeed'
import { NewsSkeleton } from '@/components/news/NewsSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { IoDocumentText as JournalPage } from 'react-icons/io5'

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

export default function NewsPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={JournalPage}
        title="Market news"
        description="Last 7 days across your watchlist + popular tickers"
      />
      <Suspense fallback={<NewsSkeleton />}>
        <NewsContent />
      </Suspense>
    </PageContainer>
  )
}

async function NewsContent() {
  const watchlistItems = await listWatchlistItems()
  const watchlistSymbols = watchlistItems.map((i) => i.symbol)
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

  if (visible.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-sm text-muted-foreground">
          No recent news to show.
        </CardContent>
      </Card>
    )
  }

  const sentimentMap = await classifyNewsSentiment(
    visible.map((a) => ({ id: a.id, headline: a.headline }))
  )
  const enriched: FeedArticle[] = visible.map((a) => ({
    ...a,
    sentiment: sentimentMap.get(a.id) ?? 'neutral',
  }))

  return <NewsFeed articles={enriched} watchlist={watchlistSymbols} />
}
