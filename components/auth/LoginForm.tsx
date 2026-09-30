'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Field, Alert } from '@/components/auth/fields'
import { signInWithPassword, type AuthFormState } from '@/app/auth/actions'

const initial: AuthFormState = {}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>
      <Field
        id="password"
        label="Password"
        action={
          <Link
            href="/forgot-password"
            className="text-xs text-primary underline underline-offset-2"
          >
            Forgot password?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
