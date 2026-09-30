import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <Card className="w-full max-w-sm gap-6 py-7 shadow-2xl shadow-black/40">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <LoginForm next={next} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          No account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
