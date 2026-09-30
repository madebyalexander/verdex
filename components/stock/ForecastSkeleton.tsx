import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AICard, AIBadge, AIIcon } from '@/components/ui/ai-card'

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-white/[0.06] animate-pulse ${className}`} />
}

export function ForecastSkeleton() {
  return (
    <AICard className="gap-6" aria-busy="true">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <AIIcon className="animate-pulse" />
          <div>
            <CardTitle className="text-base">AI Forecast</CardTitle>
            <p className="text-xs text-muted-foreground">
              Analysing technicals, fundamentals, news and analyst data — this
              can take 5–15 seconds…
            </p>
          </div>
        </div>
        <div>
          <AIBadge>AI estimate — not advice</AIBadge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-7">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Bar className="h-[268px] rounded-2xl lg:col-span-3" />
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Bar className="h-[84px] flex-1 rounded-2xl" />
            <Bar className="h-[84px] flex-1 rounded-2xl" />
            <Bar className="h-[84px] flex-1 rounded-2xl" />
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-l-2 border-primary/30 pl-4">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-[80%]" />
        </div>
        <Bar className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Bar className="h-44 rounded-2xl" />
          <Bar className="h-44 rounded-2xl" />
        </div>
      </CardContent>
    </AICard>
  )
}
