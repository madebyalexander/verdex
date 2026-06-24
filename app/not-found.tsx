import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-semibold tabular-nums text-muted-foreground">
        404
      </p>
      <h1 className="text-lg font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t find what you were looking for — it may have moved, or
        the ticker doesn&apos;t exist.
      </p>
      <Link href="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </main>
  )
}
