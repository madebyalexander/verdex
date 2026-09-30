'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, Alert } from '@/components/auth/fields'
import { requestPasswordReset, type AuthFormState } from '@/app/auth/actions'

const initial: AuthFormState = {}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial)

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
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.info && <Alert tone="accent">{state.info}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}
