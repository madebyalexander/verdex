'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { ResendConfirmation } from '@/components/auth/ResendConfirmation'
import { Field, Alert } from '@/components/auth/fields'
import { signUpWithPassword, type AuthFormState } from '@/app/auth/actions'

const initial: AuthFormState = {}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
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
      <Field id="password" label="Password" hint="At least 8 characters">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
        />
      </Field>
      <Field id="confirmPassword" label="Confirm password">
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.info && (
        <Alert tone="accent">
          <p>{state.info}</p>
          {state.email && (
            <div className="mt-2">
              <ResendConfirmation email={state.email} />
            </div>
          )}
        </Alert>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
