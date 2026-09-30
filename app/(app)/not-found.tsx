import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'

export default function AppNotFound() {
  return (
    <PageContainer width="prose" className="items-center py-20 text-center">
      <p className="bg-gradient-to-b from-foreground to-foreground/20 bg-clip-text text-7xl font-semibold tracking-tight text-transparent tabular-nums">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          We couldn&apos;t find that
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          That page or ticker doesn&apos;t exist. Try searching with ⌘K, or head
          back to familiar ground.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>
          Dashboard
        </Link>
        <Link
          href="/market"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Browse markets
        </Link>
      </div>
    </PageContainer>
  )
}
