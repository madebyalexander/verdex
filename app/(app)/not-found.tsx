import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-5xl font-semibold tabular-nums text-muted-foreground">
        404
      </p>
      <h1 className="text-lg font-semibold tracking-tight">Not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page or ticker doesn&apos;t exist. Try searching (⌘K), or head back.
      </p>
      <div className="flex gap-2">
        <Link href="/dashboard">
          <Button>Dashboard</Button>
        </Link>
        <Link href="/market">
          <Button variant="outline">Markets</Button>
        </Link>
      </div>
    </div>
  )
}
