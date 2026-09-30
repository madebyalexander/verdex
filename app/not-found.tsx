import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="text-7xl font-semibold tracking-tight text-foreground/25 tabular-nums">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find what you were looking for — it may have moved, or
          the ticker doesn&apos;t exist.
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>
        Back to dashboard
      </Link>
    </main>
  )
}
