'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Field, Alert } from '@/components/auth/fields'
import { updatePassword, type AuthFormState } from '@/app/auth/actions'

const initial: AuthFormState = {}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="password" label="New password" hint="At least 8 characters">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
        />
      </Field>
      <Field id="confirmPassword" label="Confirm new password">
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
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}
