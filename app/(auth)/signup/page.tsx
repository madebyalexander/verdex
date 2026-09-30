import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignupForm } from '@/components/auth/SignupForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm gap-6 py-7 shadow-2xl shadow-black/40">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Get AI-powered forecasts on every stock you track.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <SignupForm />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
