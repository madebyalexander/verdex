import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function PortfolioSkeleton({ positions = 4 }: { positions?: number }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-hidden>
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-11 w-56 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Share of market value</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <div className="size-44 rounded-full border-[14px] border-muted animate-pulse" />
            <div className="flex w-full flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3.5 w-full rounded bg-muted animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="list" className="gap-2" aria-hidden>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Cost basis vs live market value</CardDescription>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {Array.from({ length: positions }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="size-9 rounded-xl bg-muted animate-pulse" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="hidden h-4 w-20 rounded bg-muted animate-pulse sm:block" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
