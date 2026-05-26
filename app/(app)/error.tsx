'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <main className="p-6 max-w-md mx-auto flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm font-mono break-words text-muted-foreground">
            {error.message || 'Unknown error'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
