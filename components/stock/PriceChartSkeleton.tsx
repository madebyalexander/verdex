import { Card } from '@/components/ui/card'

export function PriceChartSkeleton() {
  return (
    <Card className="gap-4 pb-4" aria-busy="true" aria-label="Loading price chart">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5">
        <div className="flex min-h-12 flex-col justify-center gap-2">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-60 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mx-4 h-[280px] rounded-xl bg-muted/50 animate-pulse sm:h-[360px]" />
      <div className="mx-5 h-3 w-56 rounded bg-muted animate-pulse" />
    </Card>
  )
}
