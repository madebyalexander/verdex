'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '@/components/layout/PageContainer'
import { IoWarning as Warning } from 'react-icons/io5'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app boundary]', error)
  }, [error])

  return (
    <PageContainer width="prose">
      <Card>
        <EmptyState
          icon={Warning}
          tone="warning"
          title="Something went wrong"
          description={
            <>
              We hit an unexpected error loading this page. Trying again often
              fixes it.
              {error.digest && (
                <span className="mt-2 block text-xs">
                  Reference: <span className="font-mono">{error.digest}</span>
                </span>
              )}
            </>
          }
          action={
            <>
              <Button size="lg" onClick={reset}>
                Try again
              </Button>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Back to dashboard
              </Link>
            </>
          }
        />
      </Card>
    </PageContainer>
  )
}
