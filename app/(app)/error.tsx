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
            We hit an unexpected error loading this page. Trying again often
            fixes it.
          </CardDescription>
        </CardHeader>
        {error.digest && (
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Reference: <span className="font-mono">{error.digest}</span>
            </p>
          </CardContent>
        )}
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
