import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-sm gap-6 py-7 shadow-2xl shadow-black/40">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
