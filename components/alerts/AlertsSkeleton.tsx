import { Card } from '@/components/ui/card'

export function AlertsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card variant="list" className="gap-0 py-0" aria-hidden>
      <div className="border-b border-border px-5 py-3">
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="size-9 rounded-xl bg-muted animate-pulse" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-3 w-36 rounded bg-muted animate-pulse" />
            </div>
            <div className="size-7 rounded-md bg-muted animate-pulse" />
          </li>
        ))}
      </ul>
    </Card>
  )
}
