import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function IndicatorsSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <CardTitle>Technical signals</CardTitle>
        <div className="h-3.5 w-64 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="h-[74px] rounded-2xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
