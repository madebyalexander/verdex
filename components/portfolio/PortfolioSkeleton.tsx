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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-7 w-28 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>
              <span className="inline-block h-3 w-40 rounded bg-muted animate-pulse align-middle" />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="size-44 rounded-full bg-muted animate-pulse" />
          </CardContent>
        </Card>

        <Card variant="list" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <CardDescription>
              <span className="inline-block h-3 w-48 rounded bg-muted animate-pulse align-middle" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {Array.from({ length: positions }).map((_, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] items-center gap-4 py-3 border-b last:border-b-0 border-border"
                >
                  <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-10 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-14 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-14 rounded bg-muted animate-pulse" />
                  <div className="hidden sm:block h-4 w-16 rounded bg-muted animate-pulse" />
                  <div className="hidden sm:block h-4 w-20 rounded bg-muted animate-pulse" />
                  <div className="hidden sm:block h-7 w-7 rounded-md bg-muted animate-pulse" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
