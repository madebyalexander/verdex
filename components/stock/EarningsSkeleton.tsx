import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function EarningsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
        <CardDescription>
          Upcoming earnings dates and analyst estimates · next 90 days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y divide-border border-t border-border">
          {Array.from({ length: 1 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-5 py-3 flex-wrap"
            >
              <div className="flex flex-col gap-1.5 min-w-[8rem] shrink-0">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex items-center gap-6 ml-auto">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
