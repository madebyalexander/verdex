'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  signUpWithPassword,
  type AuthFormState,
} from '@/app/auth/actions'
import { cn } from '@/lib/utils'

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
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.info && <Alert tone="accent">{state.info}</Alert>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Alert({
  tone,
  children,
}: {
  tone: 'danger' | 'accent'
  children: React.ReactNode
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'rounded-md p-3 text-sm ring-1 ring-inset',
        tone === 'danger' &&
          'bg-rose-500/10 text-rose-400 ring-rose-500/20',
        tone === 'accent' &&
          'bg-primary/10 text-primary ring-primary/20'
      )}
    >
      {children}
    </div>
  )
}
