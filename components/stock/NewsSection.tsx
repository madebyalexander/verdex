import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCompanyNews, type FinnhubNewsArticle } from '@/lib/apis/finnhub'
import { cn } from '@/lib/utils'

export async function NewsSection({ symbol }: { symbol: string }) {
  let articles: FinnhubNewsArticle[] = []
  try {
    articles = await getCompanyNews(symbol, 30)
  } catch (err) {
    console.error('[NewsSection]', err)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent news</CardTitle>
        </CardHeader>
        <CardContent className="text-sm py-6 rounded-md text-center text-muted-foreground bg-secondary">
          Couldn&apos;t load news.
        </CardContent>
      </Card>
    )
  }

  const visible = articles.slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle>Recent news</CardTitle>
          <Badge variant="outline">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </Badge>
        </div>
        <CardDescription>Last 30 days · Finnhub</CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-center py-6 text-muted-foreground">
            No recent news for {symbol}.
          </p>
        ) : (
          <ul>
            {visible.map((article, i) => (
              <ArticleRow
                key={article.id}
                article={article}
                isLast={i === visible.length - 1}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ArticleRow({
  article,
  isLast,
}: {
  article: FinnhubNewsArticle
  isLast: boolean
}) {
  const date = new Date(article.datetime * 1000)
  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
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
        <div className="flex items-center gap-2 text-xs mt-1.5 text-muted-foreground">
          {article.source && <span>{article.source}</span>}
          {article.source && <span aria-hidden>·</span>}
          <span>{dateLabel}</span>
          {article.category && (
            <>
              <span aria-hidden>·</span>
              <span>{article.category}</span>
            </>
          )}
        </div>
      </a>
    </li>
  )
}
