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

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[auth boundary]', error)
  }, [error])

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Couldn&apos;t load this page</CardTitle>
        <CardDescription>
          Something went wrong while loading auth.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-mono break-words text-muted-foreground">
          {error.message || 'Unknown error'}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/login">
          <Button variant="outline">Sign in</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
