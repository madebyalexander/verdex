import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { checkAndTriggerAlerts } from '@/lib/alerts'
import { IoWarning as WarningTriangle } from 'react-icons/io5'

export async function TriggeredAlerts({
  symbol,
  currentPrice,
}: {
  symbol: string
  currentPrice: number
}) {
  const triggered = await checkAndTriggerAlerts(symbol, currentPrice)
  if (triggered.length === 0) return null

  return (
    <Card size="sm" className="bg-amber-500/[0.06] ring-amber-500/25">
      <CardContent className="flex flex-col gap-2 py-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20 gap-1"
          >
            <WarningTriangle aria-hidden className="size-3" />
            <span>Alert triggered</span>
          </Badge>
          <span className="text-sm font-medium">
            {triggered.length === 1
              ? `Your alert just fired for ${symbol}`
              : `${triggered.length} alerts just fired for ${symbol}`}
          </span>
        </div>
        <ul className="text-xs flex flex-col gap-1 pl-1 text-muted-foreground">
          {triggered.map((a) => (
            <li key={a.id}>
              {symbol} went <strong>{a.condition}</strong> $
              {Number(a.target_price).toFixed(2)} · current $
              {currentPrice.toFixed(2)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
