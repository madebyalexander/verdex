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

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <LoginForm />
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
            className="text-primary underline underline-offset-2"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
