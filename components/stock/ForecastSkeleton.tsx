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
      <CardContent className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-2xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.07]"
            >
              <Bar className="h-4 w-16" />
              <div className="flex flex-col gap-2">
                <Bar className="h-3 w-14" />
                <Bar className="h-7 w-28" />
                <Bar className="h-3 w-32" />
              </div>
              <Bar className="h-1.5 w-full rounded-full" />
              <Bar className="h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 border-l-2 border-primary/30 pl-4">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-[92%]" />
          <Bar className="h-4 w-[70%]" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Bar className="h-44 rounded-2xl" />
          <Bar className="h-44 rounded-2xl" />
        </div>
      </CardContent>
    </AICard>
  )
}
